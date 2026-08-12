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
    const date = new Date(comment.created_at).toLocaleDateString("hu-HU");

    item.className = "forum-comment";
    meta.className = "forum-comment-meta";
    meta.textContent = `${getDisplayName(comment.user_id)} | ${date}`;
    body.className = "mb-0";
    body.textContent = comment.body;

    item.append(meta, body);
    container.appendChild(item);
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
    renderComments(commentsWrap, post.forum_comments || []);
    commentsWrap.appendChild(createCommentForm(post.id));

    item.append(meta, title, body, commentsWrap);

    postsList.appendChild(item);
  });
}

async function loadPosts() {
  window.siteFeedback?.loading("Beszélgetések betöltése...");

  const { data, error } = await supabase
    .from("forum_posts")
    .select("id,user_id,title,body,created_at,forum_comments(id,user_id,body,created_at)")
    .order("created_at", { ascending: false })
    .order("created_at", { referencedTable: "forum_comments", ascending: true })
    .limit(20);

  if (error) {
    setStatus(error.message, "danger");
    window.siteFeedback?.error(error.message);
    return;
  }

  const userIds = [];
  (data || []).forEach((post) => {
    userIds.push(post.user_id);
    (post.forum_comments || []).forEach((comment) => userIds.push(comment.user_id));
  });
  await loadProfiles(userIds);
  renderPosts(data || []);
  window.siteFeedback?.hide();
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
