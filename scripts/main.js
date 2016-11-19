
/*eslint-env browser, parsedInput */
/*eslint no-var: "error"*/
/*eslint prefer-const: "error"*/
/*eslint-env es6*/

document.addEventListener("DOMContentLoaded", (event) => {
    openDb()
        .then(getListOfStoriesInDb)
        .then(updateSideBarMenu)
        .catch((reason) => {
            console.log("DOMContentLoaded catch, reason: ", reason);
        })
    .then(() => {
        console.groupEnd("pageStart");
        window.performance.clearMarks();
    });
});
//btnScrape.addEventListener("click", StartScrap);
aboutbtn.addEventListener("click", displayScreen.bind(this, "about"));
homebtn.addEventListener("click", displayScreen.bind(this, "home"));
mobileNav.addEventListener("click", toggleSideBar.bind(this));
nextChapterLink.addEventListener("click", changeToNextChapter.bind(this));
previousChapterLink.addEventListener("click", changeToPreviousChapter.bind(this));

inputScrape.addEventListener("focus", (e) => {
    this.value = "";
}); //optionally clear on 'beforepaste'

//ScrapeButtonStarter();
btnScrape.addEventListener("click",
    () => {
        ScrapeButtonStarter()
            .then(getStoryInfo)
            .then(parseStoryInfo)
            .then(buildChapterPromises)
            .then(getAllChapters)
            .then(upsertAllChaptersFromArray)
            .then(getListOfStoriesInDb) //TODO: only disable loader gif? still need to create/enable gif
            .then(updateSideBarMenu) //TODO: not necessary to list and update again
            //.then(populateDropDownMenu) 
            .catch((reason) => {
                console.log("inside catch, reason: ", reason);
            })
        .then(reportPerformance);
    });
btnScrapeAndDrive.addEventListener("click",
    () => {
        ScrapeButtonStarter()
            .then(getStoryInfo)
            .then(parseStoryInfo)
            .then(buildChapterPromises)
            .then(getAllChapters)
            .then(upsertAllChaptersFromArray)
            .then(getListOfStoriesInDb) //TODO: only disable loader gif? still need to create/enable gif
            .then(updateSideBarMenu)    //TODO: not necessary to list and update again
            .then(StartGoogleDrive)
            .then(forceAuthGoogleDrive)
            .then(createAppFolderAsync)
            .then(storyUploadProcess)
            //.then(populateDropDownMenu) 
            .catch((reason) => {
                console.log("inside catch, reason: ", reason);
            })
        .then(reportPerformance);
    });

btnRestore.addEventListener("click",
    () => {
        StartGoogleDrive()
            .then(forceAuthGoogleDrive)
            .then(createAppFolderAsync)
            .then(restoreFromGoogle)
            .catch((reason) => {
                console.log("inside catch, reason: ", reason);
            })
        .then(reportPerformance);
    });
const deleteStoryProcess = (storyId) => {
    console.log("enter deleteStoryProcess",storyId);
    globalDeleteStoryId = storyId;
    deleteStoryDb(storyId)
    StartGoogleDrive()
        .then(checkAuthGoogleDrive)
        .then(deleteStoryGd)
        .catch((reason) => {
                console.log("inside catch, reason: ", reason);
        })

}
const restoreFromGoogleProcess = () => {
     StartGoogleDrive()
            .then(forceAuthGoogleDrive)
            .then(createAppFolderAsync)
            .then(restoreFromGoogle)
            .catch((reason) => {
                console.log("inside catch, reason: ", reason);
        })
    
    // flatten resp in arrays of Chapters grouped from same story
    //const story1array = [];
    //const story2array = [story1array, story2array];
    const arrayOfStories = [];
    for(let i = 0; i <= arrayOfStories.length; i++){//loop arrayOfStories
        upsertAllChaptersFromArray(arrayOfStories[i]);
    }
}