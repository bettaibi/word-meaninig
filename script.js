class WordMeaning{

    constructor(){
        this.popup = null;
        this.speller = new Audio();
        this.lang = 'en';
        this.openState = false;
        this.startMovement = false;
        this.synth = window.speechSynthesis;
        this.selectedText = null;
        this.spellerExist = false;
    }

    async getSelectionText(){
        var text = "";
        if (window.getSelection) {
            text = window.getSelection().toString();
            console.log(window.getSelection())
        } else if (document.selection && document.selection.type != "Control") {
            text = document.selection.createRange().text;
        }
        this.selectedText = text;
        return text;
    }

    async emptyResults(e, data){
        
        if(e.type === "mouseup"){
            this.popup = document.createElement('div');
            this.popup.className = 'bn-popup';
            var attr = document.createAttribute('style');
            attr.value = `top: ${e.pageY + 10}px; left: ${e.pageX}px`;
            this.popup.setAttributeNode(attr);
            const noResults = await this.getEmptyResults();
            this.popup.innerHTML = `<span id="bn-close">X</span>${noResults}`;
            document.body.appendChild(this.popup);
            document.getElementById('bn-close').addEventListener('click', async (e)=>{
                e.stopPropagation();
                await this.removePopup();
            });
            this.openState = true;
        }
    }

    async createPopup(e, data){
        try{
            if(e.type === "mouseup"){
                this.popup = document.createElement('div');
                this.popup.className = 'bn-popup';
                var attr = document.createAttribute('style');
                attr.value = `top: ${e.pageY + 10}px; left: ${e.pageX}px`;
                this.popup.setAttributeNode(attr);

                const header = await this.getHeader(data);
                const main = await this.getMain(data);
                const footer = await this.getFooter(data);
                this.popup.innerHTML = `<span id="bn-close">X</span><div id="bn-popup-drag">
                <h3>Definitions of <span class="word">${data.word}</span></h3></div><div id="scrollable">${header} ${main}</div> ${footer}`;
                document.body.appendChild(this.popup);

                document.getElementById('spell-it').addEventListener('click', async (e)=>{
                    e.stopPropagation();
                    await this.play();
                });

                document.getElementById('bn-close').addEventListener('click', async (e)=>{
                    e.stopPropagation();
                    await this.removePopup();
                });

                this.move();
                this.openState = true;
                document.body.style.userSelect = 'none !important';
            }
        }
        catch(err){
            throw err;
        }
    }

    async play(){
        if(this.spellerExist){
            this.speller.play();
        }
        else{
            var utterThis = new SpeechSynthesisUtterance(this.selectedText);
            utterThis.lang = this.lang;
            this.synth.speak(utterThis);
        }
    }

    async getHeader(data){
        this.spellerExist = data.phonetics[0].audio?true:false;
        if(this.spellerExist)
        this.speller.src = data.phonetics[0].audio;
        let volumeIcon = chrome.runtime.getURL("images/volume.svg");

        const template = `
        <header class="d-flex flex-row space-between">
            <div style="margin-bottom: 0.5rem !important;">
                <h3 style="font-weight: bold !important;">Meanings</h3>
                <small>Source: Google Dictionary</small><br>
            </div>
            <div>
                <span>${this.spellerExist?data.phonetics[0].text:'Spell It'}</span>
                <img id="spell-it" src=${volumeIcon} width="18" style="vertical-align: sub;filter: contrast(0.4);"/>
            </div>
        </header>
        `;
        return template;
    }

    async getMain(data){
        const template = `
        <div class="main">
            ${
                data.meanings.map((item)=>{
                    return `
                        <div>
                            <h3 class="partOfSpeech">${item.partOfSpeech}</h3>
                            ${
                                item.definitions.map((def, index)=>{
                                    return `
                                    <div class="definitions d-flex flex-row" style="margin-top:0.3rem !important;">
                                        <div class="number-container">
                                            <span class="number">${index + 1}</span>
                                        </div>
                                        <div class="content">
                                            <div class="def">
                                               ${def.definition}
                                            </div>
                                            <span class="eg">${def.example?def.example:''}</span>
                                            <br>
                                            <h3 style="font-weight: bold !important; margin: 0.5rem 0 !important;">${def.synonyms?'Synonyms:':''}</h3>
                                            <div class="synonyms">
                                            ${
                                              def.synonyms?
                                              def.synonyms.map((synonym) => {return `<span>${synonym}</span>`}).join('')
                                              :''
                                            }
                                            </div>
                                        </div>
                                    </div>
                                    `
                                }).join("")
                            }
                        </div>
                    `
                }).join("")
            }

        </div>
        `;
        return template
    }

    async getFooter(){
        const template = `
            <footer id="footer">
                <small>Developed by Nidhal Bettaibi</small>
            </footer>
        `;
        return template;
    }

    async getEmptyResults(){
        let searchIcon = chrome.runtime.getURL("images/no-result.svg");
        const template = `
        <div class="empty-popup-result">
            <img id="no-res" src=${searchIcon}>
            <h4 style="margin-bottom:1rem !important; font-weight: 600 !important">No Definitions Found</h4>
            <small class="message">Sorry pal, we couldn't find definitions for the word you were looking for.</small>
        </div>
        `;
        return template;
    }

    async getGoogleDefinition(word){
        try{
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/${this.lang}/${word}`);
            const data = await response.json();
            console.log(data)
            return data;
        }
        catch(err){
            throw err;
        }
    }

    async removePopup(){
        this.openState = false;
        this.speller = new Audio();
        this.popup.remove();
        this.popup = null;
        this.spellerExist = false;
    }

    set setLang(lang){
        this.lang = lang;
    }

    move(){
        const popupHeader = document.getElementById('bn-popup-drag');
        popupHeader.onmousedown = (event)=>{
            event.stopPropagation();
            this.startMovement = true;
        }

        popupHeader.onmouseup = (event) =>{
            event.stopPropagation();
            this.startMovement = false;
        }
    }

    updatePosition(x, y){
        this.popup.style.left = x +'px';
        this.popup.style.top = y + 'px';
    }

    async getData(event, text){
        let googleSource = await this.getGoogleDefinition(text);

        if((googleSource instanceof Array) && !this.openState)
        await this.createPopup(event, googleSource[0]);
        else if(!(googleSource instanceof Array) && !this.openState)
        await this.emptyResults(event, googleSource);
        else return;
    }

}


const wordMeaning = new WordMeaning();
wordMeaning.setLang = document.documentElement.lang;

document.onmouseup = document.onkeyup = async (e)=> {
    try{
        e.stopPropagation();
        wordMeaning.startMovement = false;
        if(!wordMeaning.openState){
            let text = await wordMeaning.getSelectionText();
            text = text.trim();
            let trimed = text.match(/\s/gi);
            let matches = text.match( /[0-9]|[@,_,/,\,?,*,-,+,=,(,),{,},#,.]/gi );
            let test = text && trimed == null && matches == null ;
            if(test){
                await wordMeaning.getData(e, text.trim());
            }
            else return;
        }
    }
    catch(err){
        throw err;
    }
};

document.onmousemove = (event)=>{
    try{
        if(wordMeaning.openState && wordMeaning.startMovement){
            wordMeaning.updatePosition(event.pageX, event.pageY);
        } 
    }
    catch(err){
        throw err;
    }
};




