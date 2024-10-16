import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { backend } from 'declarations/backend';

let authClient = null;
let quill = null;
let currentUser = null;

async function init() {
  authClient = await AuthClient.create();
  const isAuthenticated = await authClient.isAuthenticated();

  if (isAuthenticated) {
    handleAuthenticated();
  } else {
    document.getElementById('login-button').onclick = async () => {
      await authClient.login({
        identityProvider: "https://identity.ic0.app/#authorize",
        onSuccess: handleAuthenticated,
      });
    };
  }

  document.getElementById('new-post-button').onclick = () => {
    document.getElementById('new-post-modal').style.display = 'block';
  };

  document.getElementById('close-modal').onclick = () => {
    document.getElementById('new-post-modal').style.display = 'none';
  };

  document.getElementById('submit-post-button').onclick = submitPost;

  // Initialize Quill editor
  quill = new Quill('#editor', {
    theme: 'snow'
  });

  loadPosts();
}

function handleAuthenticated() {
  currentUser = authClient.getIdentity().getPrincipal().toText();
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('blog').style.display = 'block';
}

async function submitPost() {
  const submitButton = document.getElementById('submit-post-button');
  submitButton.disabled = true;
  submitButton.textContent = 'Submitting...';

  const title = document.getElementById('post-title').value;
  const body = quill.root.innerHTML;

  try {
    const identity = authClient.getIdentity();
    const agent = new HttpAgent({ identity });
    const backendActor = Actor.createActor(backend.idlFactory, {
      agent,
      canisterId: backend.canisterId,
    });

    await backendActor.createPost(title, body);
    document.getElementById('new-post-modal').style.display = 'none';
    document.getElementById('post-title').value = '';
    quill.setContents([]);

    loadPosts();
  } catch (error) {
    console.error('Error submitting post:', error);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Submit';
  }
}

async function loadPosts() {
  const postsDiv = document.getElementById('posts');
  postsDiv.innerHTML = 'Loading...';

  try {
    let posts = await backend.getPosts();
    postsDiv.innerHTML = '';
    posts = posts.reverse(); // Show most recent posts at the top

    posts.forEach(post => {
      const postDiv = document.createElement('div');
      postDiv.className = 'post';

      const title = document.createElement('h2');
      title.textContent = post.title;

      const author = document.createElement('p');
      author.className = 'author';
      author.textContent = `By ${post.author}`;

      const timestamp = new Date(Number(post.timestamp / 1000000n));
      const time = document.createElement('p');
      time.className = 'time';
      time.textContent = timestamp.toLocaleString();

      const body = document.createElement('div');
      body.innerHTML = post.body;

      postDiv.appendChild(title);
      postDiv.appendChild(author);
      postDiv.appendChild(time);
      postDiv.appendChild(body);

      postsDiv.appendChild(postDiv);
    });
  } catch (error) {
    console.error('Error loading posts:', error);
    postsDiv.innerHTML = 'Failed to load posts.';
  }
}

init();
