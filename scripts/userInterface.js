/*eslint-env browser */
/*eslint no-var: "error"*/
/*eslint prefer-const: "error"*/
/*eslint-env es6*/

function displayScreen(currentDisplay) {
    const offreader = document.querySelector(".offreader");
    const home = document.querySelector(".home");
    const about = document.querySelector(".about");
    offreader.style.display = "none";
    home.style.display = "none";
    about.style.display = "none";

    if (currentDisplay === "about")
        about.style.display = "block";
    else if (currentDisplay === "home")
        home.style.display = "block";
    else
        offreader.style.display = "block";
}

function toggleSideBar() {
    const sidebar = document.querySelector(".sidebar");
    const navToggle = document.querySelector(".nav-toggle");

    navToggle.classList.toggle("active");
    const style = window.getComputedStyle(sidebar);
    sidebar.style.display = style.display === "none" ? "block" : "none";
}

function populateChaptersSelectOptions() {
    const chaptersSelect = document.querySelector("#chapters-select");
    chaptersSelect.innerHTML = "";
    const optionHtml = document.createDocumentFragment();
    for (let i = 1; i <= Story.chapters; i++) {
        optionHtml.appendChild(new Option(`Chapter: ${i}`, i));
    }
    chaptersSelect.appendChild(optionHtml);
    chaptersSelect.addEventListener("change", () => {
        goToChapter(this.value);
    });
}

const populateDropDownMenu = (data) => {
    const promise = new Promise((resolve, reject) => {
        console.log("populateDropDownMenu, data:", data);
        for (let i = 1; i <= that.scrape.totalOfChapters; i++) {
            const opt = document.createElement("option");
            opt.value = i;
            opt.innerHTML = "Chapter: " + i;
            chaptersSelect.appendChild(opt);
        };
        chaptersSelect.addEventListener("change", () => {
            goToChapter(this.value);
        });
        resolve();
    });
    return promise;
};

function closeMobileSidebar() {
    const sidebar = document.querySelector(".sidebar");
    const navToggle = document.querySelector(".nav-toggle");

    if (navToggle.classList.contains("active")) {
        navToggle.classList.remove("active");
        sidebar.style.display = "none";
    }
}

function goToChapter(chapter) {
    Story.currentChapter = chapter;
    updateNav();
    getCurrentChapter();
}

function getCurrentChapter() {
    const nextStoryPath = Story.id + "." + Story.currentChapter;
    getChapter(nextStoryPath);
}

function changeToNextChapter(e) {
    const next = document.querySelector(".next");
    if (next.classList.contains("disable"))
        return;

    Story.currentChapter += 1;
    getCurrentChapter();
    updateNav();
    e.preventDefault();
}

function changeToPreviousChapter(e) {
    const prev = document.querySelector(".prev");
    if (prev.classList.contains("disable"))
        return;

    if (Story.currentChapter > 1) {
        Story.currentChapter -= 1;
        getCurrentChapter();
        updateNav();
    }
    e.preventDefault();
}

function updateNav() {
    const chaptersSelect = document.querySelector("#chapters-select");
    chaptersSelect.selectedIndex = Story.currentChapter - 1;
    if (Story.currentChapter > 1) {
        previousChapterLink.classList.remove("disable");

        if (Story.currentChapter == Story.chapters) {
            nextChapterLink.classList.add("disable");
        } else {
            nextChapterLink.classList.remove("disable");
        }
    } else if (Story.currentChapter === 1) {
        previousChapterLink.classList.add("disable");
        if (Story.chapters > 1) {
            nextChapterLink.classList.remove("disable");
        }
    }
}

function updateSideBarMenu() {
    const promise = new Promise((resolve, reject) => {
        window.performance.mark('startUpdateSideBarMenu');
        const data = that.sidebarMenu;
        const strList = document.querySelector(".sidebar-list");
        strList.innerHTML = "";
        data.forEach((obj, i) => {
            strList.insertAdjacentHTML("beforeend",
                `
        <a href="#" class="sidebar-list--item story-sel" data-story="${i}" title="${obj.StoryName}">
            <span class="sidebar-list--text">${obj.StoryName} - ${obj.TotalOfChapters} chapters</span>
        </a>`);
        });

        const storySelector = document.querySelectorAll(".story-sel");
        for (let i = storySelector.length - 1; i >= 0; i--) {
            storySelector[i].addEventListener("click",
                (e) => {
                    console.log(this.dataset.story);
                    const s = this.dataset.story;
                    console.log(data[s]);
                    Story.name = data[s].StoryName;
                    Story.id = data[s].storyChapterId.split(".")[0];
                    Story.chapters = data[s].totalOfChapters;
                    chaptersTotal.textContent = Story.chapters;
                    title.textContent = Story.name;
                    Story.currentChapter = 1;

                    closeMobileSidebar();
                    getCurrentChapter();
                    updateNav();
                    populateChaptersSelectOptions();
                    displayScreen();
                });
        };
        window.performance.mark('endUpdateSideBarMenu');
        resolve();
    });
    return promise;
}