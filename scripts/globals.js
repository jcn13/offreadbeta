/*eslint-env browser */
/*eslint no-var: "error"*/
/*eslint prefer-const: "error"*/
/*eslint-env es6*/

const that = this;
that.batchRequestDelay = 3000;
that.scrape = {
    parsedInput: {
        origin: null,
        host: null,
        href: null,
        hostname: null,
        pathname: null,
        port: null,
        protocol: null,
        search: null,
        hash: null,
        xpathLinks: null,
        xpathStory: null,
        name: null,
        hrefEmptyChapter: null,
        storyId: null,
        storyName: null
    },
    yqlGetChapterLinks: null,
    chapterLinksList: [],
    totalOfChapters: 0,
    currentChapter: 0
}
that.tempChapter = {};
that.sidebarMenu = {};
that.chapterObject = {
    chapterId: null,
    storyId: null,
    chapterNumber: null,
    storyName: null,
    totalOfChapters: null,
    chapterUrl: null,
    author: null,
    storyContent: null
};
that.retryCount = [];
const maxRequestRetry = 5;
that.chaptersArray = [];
that.storyInfo = {

};
let Story = {};

//HTML hooks
const btnScrape = document.querySelector("#btn-scrape");
const btnScrapeAndDrive = document.querySelector("#btn-scrape-drive");
const btnRestore = document.querySelector("#btn-restore");
const inputScrape = document.querySelector("#input-scrape");
const resultsAnchor = document.querySelector("#resultsAnchor");
const nextChapterLink = document.querySelector(".next");
const previousChapterLink = document.querySelector(".prev");
const chaptersTotal = document.querySelector("#chapters-total");
const chaptersSelect = document.querySelector("#chapters-select");
const mobileNav = document.querySelector("#mobile-nav");
const homebtn = document.querySelector(".home-btn");
const aboutbtn = document.querySelector(".about-btn");

//IndexedDb
const DB_NAME = "offread";
const DB_VERSION = 8;
const DB_STORE_NAME = "stories";
let db;

//Google Auth
const CLIENT_ID = "698825936465-j1cs44897v5flnfrf7fpppnukp6okpq7.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive";
let id = null;
let idOff = null;
let globalAppFolderGoogleId = null;
let globalStoryFolderGoogleId = null;
let idStory = undefined;
let storyName = undefined;
that.driveItems = [];

const supportedSites = new Map([
    ["www.fanfiction.net", {
        xpathLinks: '//*[@id="chap_select"]',
        xpathStory: '//*[@id="storytext"]',
        jsonNChapters: ".query.results.select[0].option.length"
    }],
    ["m.fanfiction.net", {
        xpathLinks: '//*[@id="jump"]',
        xpathStory: '//*[@id="storytext"]',
        jsonNChapters: ".query.results.select[0].option.length"
    }],
    ["www.fictionpress.com", {
        xpathLinks: '//*[@id="chap_select"]',
        xpathStory: '//*[@id="storytext"]',
        jsonNChapters: ".query.results.select[0].option.length"
    }],
    ["m.fictionpress.com", {
        xpathLinks: '//*[@id="d_menu"]/div/form',
        xpathStory: '//*[@id="storytext"]',
        jsonNChapters: ".query.results.select[0].option.length"
    }]
]);

const reportPerformance = function() {
    const promise = new Promise((resolve, reject) => {
        window.performance.mark("endWholeProcess");
        console.groupCollapsed("Performance report...");
        const markItems = window.performance.getEntriesByType('mark');
        const markConfig = ["DeleteStory", "WholeProcess", "GetListOfStoriesInDb", "UpdateSideBarMenu", "UploadStory", "PakoDeflateStory", "StartGoogleDriveToCreateAppFolder", "UpsertAllChaptersFromArray", "GetAllChapters", "BuildChapterPromises", "ParseStoryInfo", "GetStoryInfo"];
        console.log("markItems: ", markItems);
        let sum = 0;
        for (let j = markConfig.length - 1; j >= 0; j--) {
            for (let i = markItems.length - 1; i >= 0; i--) {
                if (markItems[i].name === `start${markConfig[j]}`) {
                    window.performance.measure(markConfig[j], `start${markConfig[j]}`, `end${markConfig[j]}`);
                    console.log(`${markConfig[j]} (ms): `,
                        window.performance.getEntriesByName(markConfig[j])[0].duration);
                    sum += window.performance.getEntriesByName(markConfig[j])[0].duration;
                }
            }
        }
        if (window.performance.getEntriesByName("WholeProcess")) {
            console.log("Sum of parts = ", sum - window.performance.getEntriesByName("WholeProcess")[0].duration);
        }
        console.groupEnd("Performance report...");
        window.performance.clearMarks();
        window.performance.clearMeasures();
        resolve();
    });
    return promise;
};

function makeRequest(data, retryCount = maxRequestRetry) {
    return new Promise((resolve, reject) => {
        if (!data || !data.url) reject();
        const xhr = new XMLHttpRequest();
        xhr.open(data.method, data.url);
        xhr.onload = function()  {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr.response);
            } else {
                if (retryCount) {
                    setTimeout(makeRequest(data, --retryCount), 100);
                } else {
                    console.error("makeRequest exceeded max of tries, status: ", this.status);
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                }
            }
        };
        xhr.onerror = function() {
            console.log("...");
            if (retryCount) {
                setTimeout(makeRequest(data, --retryCount), 100);
            } else {
                console.error("makeRequest exceeded max of tries (onerror), status: ", this.status);
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.send();
    });
};
