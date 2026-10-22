import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/+esm";
import { BUCKET, SUPABASE_KEY, SUPABASE_URL, WHATSAPP } from "../js/config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const listEl = document.getElementById("list");
const editor = document.getElementById("editor");
const banner = document.getElementById("banner");
let properties = [];
let photos = [];
let editingId = null;

function showError(id, message) {
  const node = document.getElementById(id);
  node.hidden = !message;
  node.textContent = message || "";
}

function showBanner(message) {
  banner.hidden = !message;
  banner.textContent = message || "";
}

function lines(value) {
  return String(value || "").split("\n").map((line) => line.trim()).filter(Boolean);
}

function slugify(value) {
  const slug = String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72);
  return slug || "propiedad";
}

async function requireAdmin() {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;
  const { data, error } = await supabase.from("braier_admins").select("email").eq("user_id", user.id).maybeSingle();
  if (error || !data) {
    await supabase.auth.signOut();
    return null;
  }
  return user;
}

function showApp(user) {
  loginView.hidden = true;
  appView.hidden = false;
  document.getElementById("sessionEmail").textContent = user.email || "";
  loadProperties();
}

function sortedImages(property) {
  return [...(property.braier_property_images || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

function renderList() {
  listEl.innerHTML = properties.map((property, index) => {
    const image = sortedImages(property)[0];
    return `<article class="item">
      <img alt="" src="${image ? image.url : "/media/ui/logo.png"}"/>
      <div>
        <h3>${escapeHtml(property.card_title)}</h3>
        <p>${escapeHtml(property.operation)} · ${escapeHtml(property.property_type)} · ${escapeHtml(property.price_label || "Consultar precio")}${property.published ? "" : " · Oculta"}</p>
        <div class="item-actions">
          <button type="button" data-edit="${property.id}">Editar</button>
          <button class="ghost" type="button" data-toggle="${property.id}">${property.published ? "Ocultar" : "Publicar"}</button>
          <button class="ghost" type="button" data-move="-1" data-id="${property.id}" ${index === 0 ? "disabled" : ""}>Subir</button>
          <button class="ghost" type="button" data-move="1" data-id="${property.id}" ${index === properties.length - 1 ? "disabled" : ""}>Bajar</button>
        </div>
      </div>
    </article>`;
  }).join("") || "<p class='hint'>Todavía no hay propiedades.</p>";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

async function loadProperties() {
  const { data, error } = await supabase.from("braier_properties").select("*, braier_property_images(id,url,alt,sort_order)").order("sort_order");
  if (error) {
    showBanner("");
    showError("loginError", "");
    listEl.innerHTML = `<p class="form-error">${escapeHtml(error.message)}</p>`;
    return;
  }
  properties = data || [];
  renderList();
}

function renderPhotos() {
  document.getElementById("photos").innerHTML = photos.map((photo, index) => `<div class="photo">
    <img alt="" src="${photo.preview || photo.url}"/>
    <div class="photo-actions">
      <button class="ghost" type="button" data-photo-move="-1" data-index="${index}" ${index === 0 ? "disabled" : ""}>Subir</button>
      <button class="ghost" type="button" data-photo-move="1" data-index="${index}" ${index === photos.length - 1 ? "disabled" : ""}>Bajar</button>
      <button class="danger" type="button" data-photo-remove="${index}">Quitar</button>
    </div>
  </div>`).join("");
}

function openEditor(property) {
  editingId = property?.id || null;
  editor.hidden = false;
  document.getElementById("editorTitle").textContent = property ? "Editar propiedad" : "Nueva propiedad";
  document.getElementById("deleteProperty").hidden = !property;
  showError("editorError", "");
  const fields = ["card_title", "title", "operation", "property_type", "location", "price_label", "phone", "whatsapp", "note", "description", "contract"];
  for (const name of fields) editor.elements[name].value = property?.[name] || (name === "phone" ? "+54 351 594 8375" : name === "whatsapp" ? WHATSAPP : name === "price_label" ? "Consultar precio" : "");
  editor.elements.badges.value = (property?.badges || []).join("\n");
  editor.elements.meta.value = (property?.meta || []).join("\n");
  editor.elements.features.value = (property?.features || []).join("\n");
  editor.elements.published.checked = property ? property.published : true;
  photos = property ? sortedImages(property).map((image) => ({ ...image })) : [];
  renderPhotos();
  editor.scrollIntoView({ behavior: "smooth", block: "start" });
}

function compress(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        blob ? resolve(blob) : reject(new Error("No se pudo preparar la foto"));
      }, "image/jpeg", 0.72);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la foto"));
    };
    image.src = url;
  });
}

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = event.currentTarget.querySelector("button[type=submit]");
  showError("loginError", "");
  submit.disabled = true;
  submit.textContent = "Entrando…";
  const data = new FormData(event.currentTarget);
  const { error } = await supabase.auth.signInWithPassword({
    email: String(data.get("email") || "").trim(),
    password: String(data.get("password") || ""),
  });
  if (error) {
    submit.disabled = false;
    submit.textContent = "Entrar";
    showError("loginError", "Email o contraseña incorrectos.");
    return;
  }
  const user = await requireAdmin();
  if (!user) {
    submit.disabled = false;
    submit.textContent = "Entrar";
    showError("loginError", "Esta cuenta no administra Braier Propiedades.");
    return;
  }
  showApp(user);
});

document.getElementById("signOut").addEventListener("click", async () => {
  await supabase.auth.signOut();
  appView.hidden = true;
  loginView.hidden = false;
  editor.hidden = true;
});

document.getElementById("newProperty").addEventListener("click", () => openEditor(null));
document.getElementById("closeEditor").addEventListener("click", () => { editor.hidden = true; });

listEl.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.edit) {
    openEditor(properties.find((property) => property.id === button.dataset.edit));
    return;
  }
  if (button.dataset.toggle) {
    const property = properties.find((item) => item.id === button.dataset.toggle);
    const { error } = await supabase.from("braier_properties").update({ published: !property.published }).eq("id", property.id);
    if (error) return showBanner(error.message);
    showBanner(property.published ? "Propiedad oculta." : "Propiedad publicada.");
    await loadProperties();
    return;
  }
  if (button.dataset.move) {
    const index = properties.findIndex((property) => property.id === button.dataset.id);
    const next = index + Number(button.dataset.move);
    if (next < 0 || next >= properties.length) return;
    const current = properties[index];
    const other = properties[next];
    const first = await supabase.from("braier_properties").update({ sort_order: other.sort_order }).eq("id", current.id);
    const second = await supabase.from("braier_properties").update({ sort_order: current.sort_order }).eq("id", other.id);
    if (first.error || second.error) return showBanner((first.error || second.error).message);
    await loadProperties();
  }
});

document.getElementById("photoInput").addEventListener("change", (event) => {
  for (const file of event.target.files) {
    photos.push({ file, preview: URL.createObjectURL(file), alt: file.name, url: "" });
  }
  event.target.value = "";
  renderPhotos();
});

document.getElementById("photos").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.photoRemove != null) {
    photos.splice(Number(button.dataset.photoRemove), 1);
    renderPhotos();
    return;
  }
  if (button.dataset.photoMove) {
    const index = Number(button.dataset.index);
    const next = index + Number(button.dataset.photoMove);
    if (next < 0 || next >= photos.length) return;
    const [photo] = photos.splice(index, 1);
    photos.splice(next, 0, photo);
    renderPhotos();
  }
});

editor.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = editor.querySelector("button[type=submit]");
  showError("editorError", "");
  submit.disabled = true;
  const data = new FormData(editor);
  const cardTitle = String(data.get("card_title") || "").trim();
  const title = String(data.get("title") || "").trim();
  let id = editingId;
  if (!id) {
    id = slugify(cardTitle);
    if (properties.some((property) => property.id === id)) id = `${id}-${Date.now().toString(36)}`;
  }
  const row = {
    id,
    card_title: cardTitle,
    title,
    operation: data.get("operation"),
    property_type: data.get("property_type"),
    location: String(data.get("location") || "").trim(),
    price_label: String(data.get("price_label") || "Consultar precio").trim(),
    phone: String(data.get("phone") || "+54 351 594 8375").trim(),
    whatsapp: String(data.get("whatsapp") || WHATSAPP).replace(/\D/g, "") || WHATSAPP,
    note: String(data.get("note") || "").trim(),
    badges: lines(data.get("badges")),
    meta: lines(data.get("meta")),
    description: String(data.get("description") || "").trim(),
    features: lines(data.get("features")),
    contract: String(data.get("contract") || "").trim(),
    published: editor.elements.published.checked,
    sort_order: editingId ? properties.find((property) => property.id === editingId)?.sort_order ?? properties.length : properties.length,
  };
  const { error } = await supabase.from("braier_properties").upsert(row);
  if (error) {
    submit.disabled = false;
    showError("editorError", error.message);
    return;
  }
  const uploaded = [];
  for (const photo of photos) {
    if (!photo.file) {
      uploaded.push({ url: photo.url, alt: photo.alt || cardTitle });
      continue;
    }
    const blob = await compress(photo.file);
    const path = `${id}/${crypto.randomUUID()}.jpg`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg", upsert: false });
    if (uploadError) {
      submit.disabled = false;
      showError("editorError", uploadError.message);
      return;
    }
    uploaded.push({ url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`, alt: cardTitle });
  }
  await supabase.from("braier_property_images").delete().eq("property_id", id);
  if (uploaded.length) {
    const { error: imageError } = await supabase.from("braier_property_images").insert(uploaded.map((photo, index) => ({
      property_id: id,
      url: photo.url,
      alt: photo.alt,
      sort_order: index,
    })));
    if (imageError) {
      submit.disabled = false;
      showError("editorError", imageError.message);
      return;
    }
  }
  submit.disabled = false;
  editingId = id;
  showBanner("Propiedad guardada.");
  await loadProperties();
  openEditor(properties.find((property) => property.id === id));
});

document.getElementById("deleteProperty").addEventListener("click", async () => {
  if (!editingId || !confirm("¿Eliminar esta propiedad?")) return;
  const { error } = await supabase.from("braier_properties").delete().eq("id", editingId);
  if (error) return showError("editorError", error.message);
  editor.hidden = true;
  editingId = null;
  showBanner("Propiedad eliminada.");
  await loadProperties();
});

requireAdmin().then((user) => { if (user) showApp(user); });
