import { isSupabaseConfigured, showConfigMessage, supabase } from "./supabase-client.js";

const statusBox = document.getElementById("forumStatus");
const postForm = document.getElementById("forumPostForm");
const postsList = document.getElementById("forumPosts");
const titleInput = document.getElementById("postTitle");
const bodyInput = document.getElementById("postBody");
let currentUser = null;
let profileNames = {};

function setStatus(message, type = "info") {
  if (!statusBox) {
    return;
  }

  statusBox.textContent = message;
  statusBox.className = `alert alert-${type}`;
}

function getDisplayName(userId) {
  return profileNames[userId] || "Felhasználó";
}

async function loadProfiles(userIds) {
  profileNames = {};

  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (!uniqueIds.length) {
    return;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,display_name")
    .in("id", uniqueIds);

  if (error) {
    console.warn("Profilok betöltése sikertelen:", error);
    return;
  }

  (data || []).forEach((profile) => {
    profileNames[profile.id] = profile.display_name || "Felhasználó";
  });
}

function groupCommentsByPost(comments) {
  return (comments || []).reduce((groups, comment) => {
    if (!groups[comment.post_id]) {
      groups[comment.post_id] = [];
    }

    groups[comment.post_id].push(comment);
    return groups;
  }, {});
}

function renderComments(container, comments) {
  if (!comments.length) {
    const empty = document.createElement("p");
    empty.className = "text-muted mb-0";
    empty.textContent = "Még nincs hozzászólás.";
    container.appendChild(empty);
    return;
  }

  comments.forEach((comment) => {
    const item = document.createElement("article");
    const meta = document.createElement("div");
    const body = document.createElement("p");
    const actions = document.createElement("div");
    const date = new Date(comment.created_at).toLocaleDateString("hu-HU");

    item.className = "forum-comment";
    meta.className = "forum-comment-meta";
    meta.textContent = `${getDisplayName(comment.user_id)} | ${date}`;
    body.className = "mb-0";
    body.textContent = comment.body;
    actions.className = "forum-comment-actions";

    if (currentUser?.id === comment.user_id) {
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "btn btn-outline-success btn-sm";
      editButton.textContent = "Szerkesztés";
      editButton.addEventListener("click", () => {
        showEditCommentForm(item, comment);
      });
      actions.appendChild(editButton);
    }

    item.append(meta, body, actions);
    container.appendChild(item);
  });
}

function showEditCommentForm(item, comment) {
  const originalBody = item.querySelector("p");
  const originalActions = item.querySelector(".forum-comment-actions");
  const form = document.createElement("form");
  const textarea = document.createElement("textarea");
  const saveButton = document.createElement("button");
  const cancelButton = document.createElement("button");

  form.className = "forum-comment-form";
  textarea.className = "form-control";
  textarea.rows = 3;
  textarea.required = true;
  textarea.value = comment.body;

  saveButton.type = "submit";
  saveButton.className = "btn btn-custom btn-sm";
  saveButton.textContent = "Mentés";

  cancelButton.type = "button";
  cancelButton.className = "btn btn-outline-secondary btn-sm";
  cancelButton.textContent = "Mégse";

  const buttons = document.createElement("div");
  buttons.className = "d-flex gap-2";
  buttons.append(saveButton, cancelButton);
  form.append(textarea, buttons);

  originalBody.hidden = true;
  originalActions.hidden = true;
  originalActions.insertAdjacentElement("afterend", form);

  cancelButton.addEventListener("click", () => {
    form.remove();
    originalBody.hidden = false;
    originalActions.hidden = false;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await updateComment(comment.id, textarea.value.trim());
  });
}

function createCommentForm(postId) {
  const form = document.createElement("form");
  const textarea = document.createElement("textarea");
  const button = document.createElement("button");

  form.className = "forum-comment-form";
  form.hidden = !currentUser;
  textarea.className = "form-control";
  textarea.rows = 3;
  textarea.required = true;
  textarea.placeholder = "Válasz írása";
  button.className = "btn btn-custom align-self-start";
  button.type = "submit";
  button.textContent = "Válasz küldése";

  form.append(textarea, button);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveComment(postId, textarea.value.trim());
  });

  return form;
}

function renderPosts(posts) {
  postsList.innerHTML = "";

  if (!posts.length) {
    postsList.innerHTML = '<p class="text-muted mb-0">Még nincs beszélgetés.</p>';
    return;
  }

  posts.forEach((post) => {
    const item = document.createElement("article");
    item.className = "forum-post";

    const date = new Date(post.created_at).toLocaleDateString("hu-HU");
    const meta = document.createElement("div");
    const title = document.createElement("h2");
    const body = document.createElement("p");
    const commentsWrap = document.createElement("section");
    const commentsTitle = document.createElement("h3");

    meta.className = "forum-post-meta";
    meta.textContent = `${getDisplayName(post.user_id)} | ${date}`;
    title.textContent = post.title;
    body.textContent = post.body;
    commentsWrap.className = "forum-comments";
    commentsTitle.className = "h5";
    commentsTitle.textContent = "Hozzászólások";

    commentsWrap.appendChild(commentsTitle);
    renderComments(commentsWrap, post.comments || []);
    commentsWrap.appendChild(createCommentForm(post.id));

    item.append(meta, title, body, commentsWrap);
    postsList.appendChild(item);
  });
}

async function loadComments(postIds) {
  if (!postIds.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("forum_comments")
    .select("id,post_id,user_id,body,created_at")
    .in("post_id", postIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

async function loadPosts() {
  window.siteFeedback?.loading("Beszélgetések betöltése...");

  const { data: posts, error } = await supabase
    .from("forum_posts")
    .select("id,user_id,title,body,created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    setStatus(error.message, "danger");
    window.siteFeedback?.error(error.message);
    return;
  }

  try {
    const postIds = (posts || []).map((post) => post.id);
    const comments = await loadComments(postIds);
    const commentsByPost = groupCommentsByPost(comments);

    const userIds = [];
    (posts || []).forEach((post) => userIds.push(post.user_id));
    comments.forEach((comment) => userIds.push(comment.user_id));

    await loadProfiles(userIds);
    renderPosts((posts || []).map((post) => ({
      ...post,
      comments: commentsByPost[post.id] || []
    })));
    window.siteFeedback?.hide();
  } catch (commentError) {
    setStatus(commentError.message, "danger");
    window.siteFeedback?.error(commentError.message);
  }
}

async function refreshSession() {
  const { data } = await supabase.auth.getUser();
  currentUser = data.user;

  postForm.hidden = !currentUser;

  if (currentUser) {
    setStatus("Bejelentkezve. Új beszélgetést indíthatsz.", "success");
  } else {
    setStatus("Olvasni lehet bejelentkezés nélkül, íráshoz jelentkezz be.", "secondary");
  }
}

async function saveComment(postId, body) {
  if (!currentUser) {
    setStatus("Írás előtt jelentkezz be.", "warning");
    window.siteFeedback?.error("Írás előtt jelentkezz be.");
    return;
  }

  if (!body) {
    return;
  }

  window.siteFeedback?.loading("Válasz mentése...");

  const { error } = await supabase.from("forum_comments").insert({
    post_id: postId,
    user_id: currentUser.id,
    body
  });

  if (error) {
    setStatus(error.message, "danger");
    window.siteFeedback?.error(error.message);
    return;
  }

  await loadPosts();
  setStatus("A válasz mentve.", "success");
  window.siteFeedback?.success("A válasz mentve.");
}

async function updateComment(commentId, body) {
  if (!currentUser) {
    setStatus("Szerkesztés előtt jelentkezz be.", "warning");
    window.siteFeedback?.error("Szerkesztés előtt jelentkezz be.");
    return;
  }

  if (!body) {
    return;
  }

  window.siteFeedback?.loading("Hozzászólás mentése...");

  const { error } = await supabase
    .from("forum_comments")
    .update({
      body,
      updated_at: new Date().toISOString()
    })
    .eq("id", commentId)
    .eq("user_id", currentUser.id);

  if (error) {
    setStatus(error.message, "danger");
    window.siteFeedback?.error(error.message);
    return;
  }

  await loadPosts();
  setStatus("A hozzászólás frissítve.", "success");
  window.siteFeedback?.success("A hozzászólás frissítve.");
}

postForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  window.siteFeedback?.loading("Bejegyzés mentése...");

  await refreshSession();

  if (!currentUser) {
    setStatus("Írás előtt jelentkezz be.", "warning");
    window.siteFeedback?.error("Írás előtt jelentkezz be.");
    return;
  }

  const { error } = await supabase.from("forum_posts").insert({
    user_id: currentUser.id,
    title: titleInput.value.trim(),
    body: bodyInput.value.trim()
  });

  if (error) {
    setStatus(error.message, "danger");
    window.siteFeedback?.error(error.message);
    return;
  }

  postForm.reset();
  await loadPosts();
  setStatus("A bejegyzés mentve.", "success");
  window.siteFeedback?.success("A bejegyzés mentve.");
});

if (!isSupabaseConfigured) {
  showConfigMessage(statusBox);
} else {
  await refreshSession();
  await loadPosts();
}
