import { isSupabaseConfigured, showConfigMessage, supabase } from "./supabase-client.js";

const statusBox = document.getElementById("forumStatus");
const postForm = document.getElementById("forumPostForm");
const postsList = document.getElementById("forumPosts");
const titleInput = document.getElementById("postTitle");
const bodyInput = document.getElementById("postBody");

function setStatus(message, type = "info") {
  if (!statusBox) {
    return;
  }

  statusBox.textContent = message;
  statusBox.className = `alert alert-${type}`;
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

    meta.className = "forum-post-meta";
    meta.textContent = date;
    title.textContent = post.title;
    body.textContent = post.body;

    item.append(meta, title, body);

    postsList.appendChild(item);
  });
}

async function loadPosts() {
  window.siteFeedback?.loading("Beszélgetések betöltése...");

  const { data, error } = await supabase
    .from("forum_posts")
    .select("id,title,body,created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    setStatus(error.message, "danger");
    window.siteFeedback?.error(error.message);
    return;
  }

  renderPosts(data || []);
  window.siteFeedback?.hide();
}

async function refreshSession() {
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  postForm.hidden = !user;

  if (user) {
    setStatus("Bejelentkezve. Új beszélgetést indíthatsz.", "success");
  } else {
    setStatus("Olvasni lehet bejelentkezés nélkül, íráshoz jelentkezz be.", "secondary");
  }
}

postForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  window.siteFeedback?.loading("Bejegyzés mentése...");

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    setStatus("Írás előtt jelentkezz be.", "warning");
    window.siteFeedback?.error("Írás előtt jelentkezz be.");
    return;
  }

  const { error } = await supabase.from("forum_posts").insert({
    user_id: user.id,
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
