
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

// CONEXIÓN CON FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyDbKHWP1MQsmDvFReSz-EDKafFCBT3la_E",
  authDomain: "cerca-ya-f67f0.firebaseapp.com",
  projectId: "cerca-ya-f67f0",
  storageBucket: "cerca-ya-f67f0.firebasestorage.app",
  messagingSenderId: "943803719513",
  appId: "1:943803719513:web:d3cd9b9d7fd9ea8da0f648"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ELEMENTOS
const search = document.querySelector("#search");
const buttons = [...document.querySelectorAll("[data-cat]")];
const listings = document.querySelector("#listings");
const postForm = document.querySelector("#postForm");
const notice = document.querySelector("#notice");
const authNotice = document.querySelector("#authNotice");

let category = "Todos";
let publications = [];

// BUSCADOR Y CATEGORÍAS
function filter() {
  const q = search.value.toLowerCase();

  document.querySelectorAll(".listing").forEach(card => {
    card.hidden =
      !(category === "Todos" || card.dataset.cat === category) ||
      !card.innerText.toLowerCase().includes(q);
  });
}

buttons.forEach(button => {
  button.addEventListener("click", () => {
    category = button.dataset.cat;

    buttons.forEach(b =>
      b.classList.toggle("active", b === button)
    );

    filter();
  });
});

search.addEventListener("input", filter);

// MOSTRAR PUBLICACIONES DE FIREBASE
function renderPublications() {
  listings.replaceChildren();

  if (publications.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Todavía no hay publicaciones. ¡Sé el primero!";
    listings.append(empty);
    return;
  }

  publications.forEach(data => {
    const card = document.createElement("article");
    card.className = "listing";
    card.dataset.cat = data.categoria;

    const small = document.createElement("small");
    small.textContent = data.categoria.toUpperCase();

    const title = document.createElement("h3");
    title.textContent = data.titulo;

    const details = document.createElement("p");
    details.textContent = data.detalles;

    const info = document.createElement("span");
    info.textContent = "📍 Publicación en Cerca Ya";

    card.append(small, title, details, info);
    listings.append(card);
  });

  filter();
}

// ESCUCHAR LA BASE DE DATOS EN TIEMPO REAL
const publicationsQuery = query(
  collection(db, "publicaciones"),
  orderBy("createdAt", "desc")
);

onSnapshot(publicationsQuery, snapshot => {
  publications = snapshot.docs
    .filter(doc => doc.data().estado === "publicada")
    .map(doc => doc.data());

  renderPublications();

}, error => {
  console.error("Error cargando publicaciones:", error);
  notice.textContent = "No se pudieron cargar las publicaciones.";
});

// PUBLICAR EN FIREBASE
postForm.addEventListener("submit", async event => {
  event.preventDefault();

  const user = auth.currentUser;

  if (!user) {
    notice.textContent = "Debes iniciar sesión para publicar.";
    return;
  }

  const title = document.querySelector("#title").value.trim();
  const cat = document.querySelector("#category").value;
  const details = document.querySelector("#details").value.trim();

  if (!title || !details) {
    notice.textContent = "Completa todos los campos.";
    return;
  }

  const submitButton = postForm.querySelector('button[type="submit"], button:not([type])');

  if (submitButton) submitButton.disabled = true;

  try {
    await addDoc(collection(db, "publicaciones"), {
      uid: user.uid,
      titulo: title,
      categoria: cat,
      detalles: details,
      estado: "publicada",
      createdAt: serverTimestamp()
    });

    postForm.reset();
    notice.textContent = "¡Publicación guardada correctamente en CERCA YA!";

  } catch (error) {
    console.error(error);
    notice.textContent = "Error al publicar: " + error.message;

  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

// CREAR CUENTA
const emailInput = document.querySelector("#authEmail");
const passwordInput = document.querySelector("#authPassword");

document.querySelector("#registerBtn").addEventListener("click", async () => {
  if (!emailInput.reportValidity() ||
      !passwordInput.reportValidity()) return;

  try {
    await createUserWithEmailAndPassword(
      auth,
      emailInput.value.trim(),
      passwordInput.value
    );

    authNotice.textContent = "¡Cuenta creada correctamente!";

  } catch (error) {
    authNotice.textContent = "Error: " + error.message;
  }
});

// INICIAR SESIÓN
document.querySelector("#loginBtn").addEventListener("click", async () => {
  if (!emailInput.reportValidity() ||
      !passwordInput.reportValidity()) return;

  try {
    await signInWithEmailAndPassword(
      auth,
      emailInput.value.trim(),
      passwordInput.value
    );

    authNotice.textContent = "¡Bienvenido a CERCA YA!";

  } catch (error) {
    authNotice.textContent = "Error: " + error.message;
  }
});

// RECUPERAR CONTRASEÑA
document.querySelector("#forgotPassword").addEventListener("click", async () => {
  const email = emailInput.value.trim();

  if (!email) {
    authNotice.textContent = "Escribe primero tu correo electrónico.";
    emailInput.focus();
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    authNotice.textContent = "Correo de recuperación enviado.";

  } catch (error) {
    authNotice.textContent = "Error: " + error.message;
  }
});

// CERRAR SESIÓN
document.querySelector("#logoutBtn").addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    authNotice.textContent = "Error: " + error.message;
  }
});

// CONTROL DE SESIONES
onAuthStateChanged(auth, user => {
  const visitorMenu = document.querySelector("#visitorMenu");
  const memberMenu = document.querySelector("#memberMenu");
  const publishSection = document.querySelector("#publishSection");
  const welcomeMessage = document.querySelector("#welcomeMessage");
  const userEmail = document.querySelector("#userEmail");

  visitorMenu.hidden = !!user;
  memberMenu.hidden = !user;
  publishSection.hidden = !user;

  if (user) {
    const username = user.email.split("@")[0];

    userEmail.textContent = user.email;
    welcomeMessage.textContent =
      `¡Hola, ${username}! Bienvenido a CERCA YA.`;

  } else {
    welcomeMessage.textContent =
      "Todo lo que buscas, cerca de ti.";
  }
});
