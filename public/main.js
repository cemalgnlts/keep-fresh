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
	dlgEl.addEventListener("click", ev => ev.target === dlgEl && closeDialog(dlgEl));
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

	dlg.classList.remove("open");

	// Clear

	const dlgForm = dlg.querySelector("form");
	if (dlgForm) dlgForm.reset();

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

if (addNewBtn) {
	addNewBtn.onclick = () => {
		openDialog(addBookmarkDlg);
	};
}

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

	addColorFieldBtn.onclick = () => duplicateColorInput(inp);
};

/**
 * @param {HTMLDivElement} prevInputEl Default last element.
 * @param {String} initialValue Color value.
 */
const duplicateColorInput = (prevInputEl, initialValue) => {
	const inp = prevInputEl || document.querySelector('div[data-for="color-palette"] .input-color:last-of-type');
	const clone = inp.cloneNode(true);
	clone.classList.add("remove-when-dialog-closed");

	if (initialValue) {
		clone.querySelector("svg").style.color = initialValue;
		clone.querySelector("input[type=color]").value = initialValue;
		clone.querySelector("input[type=text]").value = initialValue;
	}

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

// Init first input color.
initColorInput(document.querySelector(".input-color"));

document.querySelector("#fontInp").onchange = ev => {
	const inp = ev.currentTarget;
	document.querySelector("#fontTitleInp").value = inp.value;
};

// Init page fetch operation.
document.getElementById("fetchPageMetaBtn").onclick = async (ev) => {
	let url = document.getElementById("linkInp").value.trim();

	if (url.length === 0 || url.length < 4) return alert("Wrong url.");

	if (!url.startsWith("http")) {
		url = `https://${url}`;
		document.getElementById("linkInp").value = url;
	}

	const params = new URLSearchParams(`url=${url}`);
	const form = ev.target.form;
	form.classList.add("pending");

	const req = await fetch(`/api/ogp?${params.toString()}`);

	if (!req.ok || !req.headers.get("content-type").includes("application/json")) {
		form.classList.remove("pending");
		return alert(req.headers.get("x-error") || "Request error");
	}

	const res = await req.json();

	document.getElementById("linkTitleInp").value = res.title;
	document.getElementById("linkInfoInp").value = res.description;
	document.getElementById("linkImageInp").value = res.image;

	form.classList.remove("pending");
};

// Init bookmark items add forms.
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
	bookmarkPreviewDlg.dataset.type = bookmarkEl.dataset.type;
	bookmarkPreviewDlg.querySelector(".dialog-title").textContent = title;
	bookmarkPreviewDlg.querySelector(".dialog-bookmark-info").textContent = info;

	const dlgContent = bookmarkPreviewDlg.querySelector(".dialog-bookmark-content");

	previewEl.classList.add("remove-when-dialog-closed");
	dlgContent.appendChild(previewEl);

	if (bookmarkEl.dataset.url || bookmarkEl.dataset.type === "font") {
		const footer = bookmarkPreviewDlg.querySelector("footer");
		const url = bookmarkEl.dataset.url || `https://fonts.google.com/specimen/${bookmarkEl.querySelector("[data-font]").dataset.font}`;

		const anchor = document.createElement("a");
		anchor.className = "btn remove-when-dialog-closed";
		anchor.href = url;
		anchor.target = "_blank";
		anchor.innerHTML = `<span>Open</span>
				<svg viewBox="0 0 24 24" class="icon" style="vertical-align: middle">
					<use href="#iconArrowUpRight" />
				</svg>`;
		footer.appendChild(anchor);
	}

	openDialog(bookmarkPreviewDlg);
};

const addFormBtns = document.querySelectorAll(".bookmark-add-form");
const handleFormSubmit = (form) => {
	if (!form.checkValidity()) {
		form.querySelectorAll("input:invalid").forEach(inp => {
			inp.onanimationend = () => inp.classList.remove("shake-horizontal");
			inp.classList.add("shake-horizontal");
		});

		return;
	}

	form.classList.add("pending");

	const formData = new FormData(form);
	const data = Array.from(formData).reduce((acc, [key, val]) => {
		if (acc[key]) {
			if (Array.isArray(acc[key])) acc[key].push(val);
			else acc[key] = [acc[key], val];
		} else acc[key] = val;

		return acc;
	}, {});

	postBookmarkData(form.action, data)
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

async function postBookmarkData(url, data) {
	const req = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data)
	});

	if (!req.ok) throw Error(req.head.get("x-error") || "Request error.");

	await closeDialog(document.querySelector(".dialog.open"));

	location.href = "/";
}

const bookmarkDeleteBtn = document.getElementById("bookmarkDelete");

if (bookmarkDeleteBtn) {
	bookmarkDeleteBtn.onclick = async () => {
		if (!confirm("Do you want to delete this bookmark?")) return;

		const dlg = document.querySelector(".dialog.open");
		const key = dlg.dataset.key;
		dlg.classList.add("pending");

		const req = await fetch(`/api/delete?key=${key}`, { method: "DELETE" });

		if (!req.ok) {
			alert(req.headers.get("x-error") || "Error occured");
			dlg.classList.remove("pending");
			return;
		}

		dlg.classList.remove("pending");

		await closeDialog(dlg);

		document.querySelector(`.bookmark[data-key="${key}"]`).remove();
	};

	document.getElementById("bookmarkEdit").onclick = async () => {
		const selectedBookmarkDlg = document.querySelector(".dialog.open");
		await closeDialog(selectedBookmarkDlg);

		const bookmarkKey = selectedBookmarkDlg.dataset.key;

		const bookmark = document.querySelector(`.bookmark[data-key="${bookmarkKey}"]`);
		const bookmarkType = bookmark.dataset.type;

		const bookmarkDlg = document.querySelector(`.dialog[data-for="${bookmarkType}"]`);
		const form = bookmarkDlg.querySelector("form");

		form.elements.title.value = bookmark.querySelector(".bookmark-title").textContent;
		form.elements.info.value = bookmark.querySelector(".bookmark-info").textContent;

		switch (bookmarkType) {
			case "link":
				const imageUrl = bookmark.querySelector(".bookmark-preview-link")
					.style.getPropertyValue("--image")
					.slice('url("'.length + 1, -2);

				form.elements.image.value = imageUrl;
				form.elements.url.value = bookmark.dataset.url;
				break;
			case "color-palette":
				const colors = Array.from(bookmark.querySelectorAll("[data-color]"), el => el.dataset.color);
				const first = colors.shift();

				bookmarkDlg.querySelector(".input-color > svg").style.color = first;
				bookmarkDlg.querySelector("input[type=color]").value = first;
				bookmarkDlg.querySelector("input[type=text]").value = first;

				colors.forEach(color => duplicateColorInput(null, color));
				break;
			case "font":
				form.elements.font.value = bookmark.querySelector("[data-font]").dataset.font;
				break;
		}

		await openDialog(bookmarkDlg);

		const bookmarkKeyInput = document.createElement("input");
		bookmarkKeyInput.className = "remove-when-dialog-closed";
		bookmarkKeyInput.type = "hidden";
		bookmarkKeyInput.name = "key";
		bookmarkKeyInput.value = bookmarkKey;
		form.appendChild(bookmarkKeyInput);
	};
}

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