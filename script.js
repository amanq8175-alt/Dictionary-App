 const url = "https://api.dictionaryapi.dev/api/v2/entries/en/";
        const searchBtn = document.getElementById("search-btn");
        const searchInput = document.getElementById("search-input");
        const resultDiv = document.getElementById("word-result");
        const errorMsg = document.getElementById("error-msg");
        const loader = document.getElementById("loader");
        const historyList = document.getElementById("history-list");
        
        let history = JSON.parse(localStorage.getItem('dictHistory')) || [];

        // Initialize History
        renderHistory();

        // Event Listeners
        searchBtn.addEventListener("click", () => {
            let word = searchInput.value.trim();
            if(word) fetchData(word);
        });

        searchInput.addEventListener("keyup", (e) => {
            if (e.key === "Enter") {
                let word = searchInput.value.trim();
                if(word) fetchData(word);
            }
        });

        // Fetch Data Function
        async function fetchData(word) {
            // UI Reset
            resultDiv.style.display = "none";
            errorMsg.style.display = "none";
            loader.style.display = "block";

            try {
                const response = await fetch(`${url}${word}`);
                const data = await response.json();

                if (data.title) {
                    // Error from API (Word not found)
                    loader.style.display = "none";
                    errorMsg.style.display = "block";
                } else {
                    loader.style.display = "none";
                    showResult(data[0]);
                    addToHistory(word);
                }
            } catch (error) {
                loader.style.display = "none";
                errorMsg.style.display = "block";
                console.error("Fetch error:", error);
            }
        }

        // Render Result Function
        function showResult(data) {
            const wordText = document.getElementById("word");
            const phoneticText = document.getElementById("phonetic");
            const playBtn = document.getElementById("play-sound");
            const meaningsContainer = document.getElementById("meanings-container");
            const extraInfo = document.getElementById("extra-info");

            wordText.innerText = data.word;
            
            // Handle Phonetics
            let audioSrc = "";
            let phoneticDisplay = "";
            
            if(data.phonetic) {
                phoneticDisplay = data.phonetic;
            } else if (data.phonetics[0] && data.phonetics[0].text) {
                phoneticDisplay = data.phonetics[0].text;
            }
            
            // Find Audio
            const audioObj = data.phonetics.find(p => p.audio && p.audio !== "");
            if (audioObj) {
                audioSrc = audioObj.audio;
                playBtn.style.display = "flex";
            } else {
                playBtn.style.display = "none";
            }

            phoneticText.innerText = phoneticDisplay;

            // Audio Play Logic
            playBtn.onclick = () => {
                const audio = new Audio(audioSrc);
                audio.play();
            };

            // Render Meanings
            meaningsContainer.innerHTML = "";
            data.meanings.forEach(meaning => {
                const group = document.createElement("div");
                group.className = "meaning-group";

                const posTitle = document.createElement("span");
                posTitle.className = "part-of-speech";
                posTitle.innerText = meaning.partOfSpeech;

                const list = document.createElement("ul");
                list.className = "definition-list";

                // Show max 2 definitions per part of speech to keep it clean
                meaning.definitions.slice(0, 2).forEach(def => {
                    const li = document.createElement("li");
                    li.innerHTML = `${def.definition} 
                                    ${def.example ? `<span class="example">"${def.example}"</span>` : ''}`;
                    list.appendChild(li);
                });

                group.appendChild(posTitle);
                group.appendChild(list);
                meaningsContainer.appendChild(group);
            });

            // Render Synonyms/Antonyms (from first meaning usually)
            extraInfo.innerHTML = "";
            const firstMeaning = data.meanings[0];
            
            if (firstMeaning.synonyms.length > 0 || firstMeaning.antonyms.length > 0) {
                extraInfo.style.display = "flex";
                
                if(firstMeaning.synonyms.length > 0) {
                    extraInfo.innerHTML += createTagGroup("Synonyms", firstMeaning.synonyms);
                }
                if(firstMeaning.antonyms.length > 0) {
                    extraInfo.innerHTML += createTagGroup("Antonyms", firstMeaning.antonyms);
                }
            } else {
                extraInfo.style.display = "none";
            }

            resultDiv.style.display = "block";
        }

        function createTagGroup(label, items) {
            let html = `<div class="tag-group">
                        <span class="tag-label">${label}</span>
                        <div class="tags">`;
            items.slice(0, 5).forEach(item => {
                html += `<span class="tag" onclick="searchInput.value='${item}'; fetchData('${item}')">${item}</span>`;
            });
            html += `</div></div>`;
            return html;
        }

        // History Management
        function addToHistory(word) {
            // Remove if exists to move to top
            history = history.filter(item => item.toLowerCase() !== word.toLowerCase());
            // Add to top
            history.unshift(word);
            // Limit to 5
            if(history.length > 5) history.pop();
            
            localStorage.setItem('dictHistory', JSON.stringify(history));
            renderHistory();
        }

        function renderHistory() {
            historyList.innerHTML = "";
            if(history.length === 0) {
                historyList.innerHTML = "<span style='font-size:12px; color:#aaa;'>No recent searches</span>";
                return;
            }
            history.forEach(word => {
                const item = document.createElement("div");
                item.className = "history-item";
                item.innerText = word;
                item.onclick = () => {
                    searchInput.value = word;
                    fetchData(word);
                };
                historyList.appendChild(item);
            });
        }