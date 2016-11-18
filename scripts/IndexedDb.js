/*eslint-env browser */
/*eslint no-var: "error"*/
/*eslint prefer-const: "error"*/
/*eslint-env es6*/

function openDb() {
    const promise = new Promise((resolve, reject) => {
        console.groupCollapsed("pageStart");
        console.log("openDb ...");
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onsuccess = function(evt) {
            // Better use "this" than "req" to get the result to avoid problems with
            // garbage collection.
            // db = req.result;
            db = this.result;
            console.log("openDb DONE");
            console.groupEnd();
            //fn();
            resolve(evt);
        };
        req.onerror = function(evt)  {
            console.error("openDb:", evt.target.errorCode);
            reject(evt);
        };
        req.onupgradeneeded = function(evt) {
            console.log("openDb.onupgradeneeded");
            const store = evt.currentTarget.result.createObjectStore(
                DB_STORE_NAME,
                { keyPath: "storyChapterId", autoIncrement: true });

            store.createIndex("storyChapterId", "storyChapterId", { unique: true });
            store.createIndex("AuthorName", "AuthorName", { unique: false });
        };
    });
    return promise;
}

/**
* @param {string} storeName
* @param {string} mode either "readonly" or "readwrite"
*/
function getObjectStore(storeName, mode) {
    const tx = db.transaction(storeName, mode);
    return tx.objectStore(storeName);
}

function clearObjectStore() {
    const promise = new Promise((resolve, reject) => {
        const store = getObjectStore(DB_STORE_NAME, "readwrite");
        const req = store.clear();
        req.onsuccess = (evt) => {
            resolve(evt);
        };
        req.onerror = (evt) => {
            reject(evt);
        };
    });
    return promise;
}

//TODO: rever de callback para promise
function getChapter(storyChapterId) {
    const promise = new Promise((resolve, reject) => {
        const request = db.transaction(DB_STORE_NAME).objectStore(DB_STORE_NAME).get(storyChapterId);
        request.onerror = (event) => {
            console.log("GetChapterError: ", request.error);
            reject(event);
        };
        request.onsuccess = (event) => {
            if (request.result) {
                const value = event.target.result;
                that.tempChapter = value;
                console.log(value.Content.slice(0, 300));
                storyList.innerHTML = `<div class="chapterBox">${value.Content}</div>`;
            }
            resolve(event.target.result);
        };
    });
    return promise;
}

//TODO: rever de callback para promise
function getListOfStoriesInDb() {
    const promise = new Promise((resolve, reject) => {
        window.performance.mark('startGetListOfStoriesInDb');
        const transaction = db.transaction(DB_STORE_NAME);
        const objectStore = transaction.objectStore(DB_STORE_NAME);
        const myArray = [];
        const storySet = new Set();
        const request = objectStore.openCursor();
        request.onsuccess = () => {
            const cursor = this.result;
            if (!cursor) return;
            if (!storySet.has(cursor.value.StoryName)) {
                myArray.push(cursor.value);
                storySet.add(cursor.value.StoryName);
            }
            cursor.continue();
        };
        request.onerror = (error) => {
            console.log("getListOfStoriesInDb onerror: ", error);
            reject(error);
        };
        transaction.oncomplete = () => {
            that.sidebarMenu = (myArray);
            window.performance.mark('endGetListOfStoriesInDb');
            resolve(myArray);
        };
    });
    return promise;
}

const upsertChapter = (obj) => {
    const promise = new Promise((resolve, reject) => {

        const store = getObjectStore(DB_STORE_NAME, "readwrite");
        let req;
        try {
            req = store.put(obj);
        } catch (e) {
            console.error("DB errpr: ", e);
            throw e;
        }
        req.onsuccess = (evt) => {
            console.log(`Chapter ${obj.storyChapterId.split('.')[1]} from story ${obj.storyName} saved on IndexedDb`);
            resolve();
        };
        req.onerror = () => {
            console.error("addStory error", this.error);
            reject(this.error);
        };
    });
    return promise;
}
const upsertAllChaptersFromArray = (objArray) => {
    const promise = new Promise((resolve, reject) => {
        window.performance.mark('startUpsertAllChaptersFromArray');
        objArray = that.chaptersArray;
        db.onerror = (event) => {
            console.error(event.target);
            window.alert("Database error: " + (event.target.wePutrrorMessage || event.target.error.name || event.target.error || event.target.errorCode));
        };
        const store = getObjectStore(DB_STORE_NAME, "readwrite");
        let i =0;
        putNext();

        function putNext() {
            if (i < objArray.length) {
                store.put(objArray[i]).onsuccess = putNext;
                ++i;
            } else {
                console.groupCollapsed("IndexedDb");
                console.log(`All ${that.scrape.parsedInput.storyName} chapters saved on IndexedDb`);
                console.groupEnd("IndexedDb");
                window.performance.mark('endUpsertAllChaptersFromArray');
                resolve(objArray);
            }
        }
    });
    return promise;
}

/**
* @param {string} storyChapterId
*/
function deleteChapter(storyChapterId) {
    const promise = new Promise((resolve, reject) => {
        console.log("deletePublication:", arguments);
        const store = getObjectStore(DB_STORE_NAME, "readwrite");
        const req = store.index("storyChapterId");
        req.get(storyChapterId).onsuccess = (evt) => {
            if (typeof evt.target.result == "undefined") {
                console.error("No matching record found");
                return;
            }
            deleteMethod(evt.target.result.storyChapterId, store)
                .then(() => { resolve() });
        };
        req.onerror = (evt) => {
            console.error("deleteChapter:", evt.target.errorCode);
            reject(evt);
        };
    });
    return promise;
}

/**
* @param {number} key
* @param {IDBObjectStore=} store
*/
function deleteMethod(key, store) {
    const promise = new Promise((resolve, reject) => {
        console.log("deleteMethod:", arguments);

        if (typeof store == "undefined")
            store = getObjectStore(DB_STORE_NAME, "readwrite");

        let req = store.get(key);
        req.onsuccess = (evt) => {
            const record = evt.target.result;
            console.log("record:", record);
            if (typeof record == "undefined") {
                console.error("No matching record found");
                reject("No matching record found");
                return;
            }
            req = store.delete(key);
            req.onsuccess = (evt) => {
                console.log("evt:", evt);
                console.log("evt.target:", evt.target);
                console.log("evt.target.result:", evt.target.result);
                console.log("delete successful");
                resolve(evt);
            };
            req.onerror = (evt) => {
                console.error("deleteMethod:", evt.target.errorCode);
                reject(evt);
            };
        };
        req.onerror = (evt) => {
            console.error("deleteMethod:", evt.target.errorCode);
            reject(evt);
        };
    });
    return promise;
}

