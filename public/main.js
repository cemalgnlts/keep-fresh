// Toggle theme.
const themeBtn = document.querySelector("#themeBtn");
themeBtn.dataset.ison = localStorage.getItem("isDark") !== "true";
themeBtn.onclick = () => {
	const isDark = document.documentElement.classList.toggle("dark");
	localStorage.setItem("isDark", isDark);
};

// Init dialogs.
const dialogs = document.querySelectorAll(".dialog");
for (const dlgEl of dialogs) {
	dlgEl.onclick = (ev) => ev.target === dlgEl && closeDialog(dlgEl);
}

const openDialog = async dlg => {
	if (!dlg) return;

	dlg.classList.add("open");

	await dlg.animate({
		opacity: 1
	}, {
		duration: 250,
		fill: "forwards"
	}).finished;

	// Focus first input in dialog.
	const inp = dlg.querySelector(".dialog-content input");
	if (inp) inp.focus();
};

const closeDialog = async dlg => {
	if (!dlg) return;

	await dlg.animate({
		opacity: 0
	}, {
		duration: 250,
		fill: "forwards"
	}).finished;

	dlg.classList.remove("open")

	const willRemove = dlg.querySelectorAll(".remove-when-dialog-closed");
	if (willRemove) [...willRemove].forEach(el => el.remove());
}

const dlgCloseEls = document.querySelectorAll(".dialog-close-btn");
for (const el of dlgCloseEls) {
	el.onclick = () => closeDialog(el.parentElement);
};

// Init menu elements.
const addNewBtn = document.querySelector("#newBookmarkBtn");
const addBookmarkDlg = document.querySelector("#addBookmarkDialog");

addNewBtn.onclick = () => {
	openDialog(addBookmarkDlg);
};

// Init bookmark items
const addBookmarkCategoryItems = document.querySelector("#addBookmarkCategoryItems");
addBookmarkCategoryItems.onclick = ev => {
	const type = ev.target.dataset.type;
	const dlg = document.querySelector(`.dialog[data-for="${type}"]`);

	closeDialog(document.querySelector(".dialog.open"));
	openDialog(dlg);
};

const bookmarkContent = document.querySelector(".content");
bookmarkContent.onclick = el => {
	const bookmarkEl = el.target.matches(".bookmark")
		? el.target
		: el.target.closest(".bookmark");

	const bookmarkPreviewDlg = document.querySelector("#bookmarkPreviewDlg");
	const title = bookmarkEl.querySelector(".bookmark-title").textContent;
	const info = bookmarkEl.querySelector(".bookmark-info").textContent;
	const previewEl = bookmarkEl.firstElementChild.cloneNode(true);

	bookmarkPreviewDlg.dataset.key = bookmarkEl.dataset.key;
	bookmarkPreviewDlg.querySelector(".dialog-title").textContent = title;
	bookmarkPreviewDlg.querySelector(".dialog-bookmark-info").textContent = info;

	const dlgContent = bookmarkPreviewDlg.querySelector(".dialog-bookmark-content");

	previewEl.classList.add("remove-when-dialog-closed");
	dlgContent.appendChild(previewEl);

	openDialog(bookmarkPreviewDlg);
};

// Init toggle buttons.
const btnIconToggleEls = document.querySelectorAll(".btn-icon-toggle");
for (const el of btnIconToggleEls) {
	el.addEventListener("click", () => {
		const isOn = el.dataset.ison === "true";
		el.dataset.ison = !isOn;
	});
}

// Init input types.
const initColorInput = inp => {
	const colorCircle = inp.querySelector("svg");
	const textField = inp.querySelector("input[type=text]");
	const colorField = inp.querySelector("input[type=color]");
	const addColorFieldBtn = inp.querySelector(".add-color");
	const removeColor = inp.querySelector(".remove-color");

	textField.onclick = () => colorField.showPicker();
	colorCircle.onclick = () => colorField.showPicker();

	colorField.oninput = () => {
		colorCircle.style.color = colorField.value;
		textField.value = colorField.value;
		// textField.style.color = colorField.value;
	};

	if (removeColor) {
		removeColor.onclick = () => inp.remove();
	}

	addColorFieldBtn.onclick = () => {
		const clone = inp.cloneNode(true);
		clone.classList.add("remove-when-dialog-closed");

		const cloneRemoveEl = clone.querySelector(".remove-color");
		if (!cloneRemoveEl) {

			const removeBtn = document.createElement("button");
			removeBtn.className = "btn btn-icon remove-color";
			removeBtn.innerHTML =
				`<svg viewBox="0 0 24 24" aria-hidden="true" class="icon" fill="currentColor"><use href="#iconTrash"/></svg>`;
			removeBtn.title = "Remove color";

			clone.querySelector(".add-color").before(removeBtn);
		}

		initColorInput(clone);
		inp.after(clone);
	};
};

const inputColors = document.querySelectorAll(".input-color");
for (const inp of inputColors) {
	initColorInput(inp);
}

const fontTitleInp = document.querySelector("#fontTitleInp");

document.querySelector("#fontInp").onchange = ev => {
	const inp = ev.currentTarget;
	fontTitleInp.value = inp.value;
};

// Init page fetch operation.
document.getElementById("fetchPageMetaBtn").onclick = async () => {
	const url = document.getElementById("linkInp").value.trim();

	if (url.length === 0 || url.length < 4) return alert("Wrong url.");

	const params = new URLSearchParams(`url=${url}`);

	const req = await fetch(`/api/ogp?${params.toString()}`);

	if (!req.ok) return alert("Request error");

	const res = await req.json();

	document.getElementById("linkTitleInp").value = res.title;
	document.getElementById("linkInfoInp").value = res.description;
	document.getElementById("linkImageInp").value = res.image;
};

// Init bookmark add forms.
const addFormBtns = document.querySelectorAll(".bookmark-add-form");
const handleFormSubmit = (form) => {
	if (!form.checkValidity()) {
		form.querySelectorAll("input:invalid").forEach(inp => {
			inp.onanimationend = () => inp.classList.remove("shake-horizontal");
			inp.classList.add("shake-horizontal");
		});

		return;
	}

	const formData = new FormData(form);
	const data = Array.from(formData).reduce((acc, [key, val]) => {
		if (acc[key]) {
			if (Array.isArray(acc[key])) acc[key].push(val);
			else acc[key] = [acc[key], val];
		} else acc[key] = val;

		return acc;
	}, {});

	form.classList.add("pending");

	postBookmarkData(data)
		.catch(err => {
			form.classList.remove("pending");
			alert(err);
		});
};

for (const form of addFormBtns) {
	form.onsubmit = ev => {
		handleFormSubmit(ev.target);
		return false;
	};

	form.querySelector("input[type=submit]").onclick = ev => {
		ev.preventDefault();
		handleFormSubmit(ev.target.form);
	};
}

async function postBookmarkData(data) {
	const req = await fetch("/api/add", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data)
	});

	if (!req.ok) throw Error("Request error.");

	await closeDialog(document.querySelector(".dialog.open"));

	location.href = "/";
}

document.getElementById("bookmarkDelete").onclick = async () => {
	if (!confirm("Do you want to delete this bookmark?")) return;

	const dlg = document.querySelector(".dialog.open");
	const key = dlg.dataset.key;
	dlg.classList.add("pending");

	const req = await fetch(`/api/delete?key=${key}`, { method: "DELETE" });

	if (!req.ok) {
		alert("Error occured");
		dlg.classList.remove("pending");
		return;
	}

	dlg.classList.remove("pending");

	await closeDialog(dlg);

	document.querySelector(`.bookmark[data-key="${key}"]`).remove();
};

// Init keys.
document.onkeyup = ev => {
	if (ev.key !== "Escape") return;

	const visibleDlg = document.querySelector(".dialog.open");
	if (visibleDlg) closeDialog(visibleDlg);
};

// load fonts
document.fonts.ready.then(loadFontPreviews);

async function loadFontPreviews() {
	let fonts = Array.from(document.querySelectorAll("[data-font]"), el => el.dataset.font);
	fonts = fonts.filter(font => !document.fonts.check(`1rem ${font}`));
	const reqs = [];

	if (fonts.length === 0) return;

	document.head.insertAdjacentHTML("beforeend", `<link rel="preconnect" href="https://fonts.googleapis.com/" crossorigin>
	<link rel="dns-prefetch" href="https://fonts.googleapis.com/"></link>`);

	for (const font of fonts) {
		const params = new URLSearchParams();
		params.set("family", font);
		params.set("text", "Aa");

		const req = fetch(`https://fonts.googleapis.com/css2?${params.toString()}`)
			.then(res => res.ok ? res.text() : false)
			.catch(() => false);

		reqs.push(req);
	}

	let res = await Promise.all(reqs);
	res = res.filter(Boolean);

	const style = document.createElement("style");
	style.textContent = res.join("");
	document.head.appendChild(style);
}