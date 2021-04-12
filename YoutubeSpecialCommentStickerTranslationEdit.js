(() => {
    let sticky;
    let stickyItems;
    let chat;
    let itemScroller;
    let settings;

    let setUpSticky = () => {
        let stickyAnchor = document.querySelector('yt-live-chat-app');
        sticky = document.createElement('div');

        sticky.id = 'sticky';
        sticky.setAttribute('class', `style-scope ytd-watch-flexy dark`);
       
        sticky.innerHTML += '<div id="settings" horizontal-align="auto" vertical-align="top" aria-disabled="false" class="style-scope yt-live-chat-app" prevent-autonav="true" style="display: none;" aria-hidden="true" tabindex="0"><div id="contentWrapper" class="style-scope iron-dropdown"><ytd-menu-popup-renderer slot="dropdown-content" class="style-scope yt-live-chat-app" tabindex="-1" use-icons_=""></ytd-menu-popup-renderer></div></div>';
        sticky.innerHTML += '<div id="chat-header" role="heading" class="style-scope yt-live-chat-renderer"><div id="primary-content" class="style-scope yt-live-chat-header-renderer"></div>';
         
        settings = sticky.querySelector('#settings');

        stickyItemsContainer = sticky.querySelector('#chat-header');
       
        stickyAnchor.parentNode.insertBefore(sticky, stickyAnchor);
        stickyAnchor.style.position = 'relative';

        stickyItems = sticky.querySelector('#primary-content'); 
        
        settings.querySelector('ytd-menu-popup-renderer').innerHTML = '<div id="items" class="style-scope ytd-menu-popup-renderer" role="listbox" tabindex="0"></div>';
    };

    let isSpecial = (author) => {
        return author.classList 
            ? (author.classList.contains('moderator') || author.classList.contains('owner')) 
            : author.content.author.classes.indexOf('moderator') > -1;
    };

    let isTranslation = (text) => {
        let pattern = /(^\/?(英訳|英訳\/en|en|tr|translation|korone|pol)(\s?:|\s?-|\s?\})\s|^\/?\[(英訳|英訳\/en|en|tr|translation|korone|pol)\])/i;

        return pattern.test(text);
    };

    let stickItem = (node) => {

        let authorElement = node.querySelector('#author-name');

        if (authorElement && (isSpecial(authorElement) || isTranslation(node.querySelector('#message').innerText.trim()))) {
            let stickyItem = document.createElement('div');
            let authorPhoto = document.createElement('div');
            let content = document.createElement('div');
            let timestamp = document.createElement('span');
            let author = document.createElement('div');
            let authorName = document.createElement('span');
            content.id = 'content';
            stickyItem.classList.add('sticky-item');
            content.classList.add('style-scope', 'yt-live-chat-text-message-renderer');
            timestamp.classList.add('timestamp');
            author.classList.add('author');
            authorName.classList.add('author-name');
            authorElement.classList.contains('moderator') ? authorName.classList.add('moderator') : null;
            authorElement.classList.contains('owner') ? authorName.classList.add('moderator', 'owner') : null;
            authorPhoto.innerHTML = node.querySelector('#author-photo').outerHTML.replace(/(\<|\/)(yt\-img\-shadow)/g, '$1div');
            timestamp.innerText = node.querySelector('#timestamp').innerText;
            authorName.innerText = authorElement.innerText;
            author.append(authorName);
            content.append(timestamp);
            content.append(author);
            content.append(node.querySelector('#message').cloneNode(true));
            stickyItem.append(authorPhoto.firstChild);
            stickyItem.append(content);
            stickyItems.append(stickyItem);
          
            chat = document.querySelector('#chat');
            itemScroller = chat.querySelector('#item-scroller');
            sticky.style.display = 'inherit';
            chat.setAttribute('style', `max-height: ${chat.offsetHeight - sticky.offsetHeight}px;`);
            itemScroller.scrollTop = itemScroller.scrollHeight;     
            stickyItems.scrollTop = stickyItems.scrollHeight;
        }
    };

    let monitor = () => {
        let chatItems = document.querySelector('#items.style-scope.yt-live-chat-item-list-renderer');
        let observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach(stickItem);
            });
        });
        chatItems.querySelectorAll('yt-live-chat-text-message-renderer').forEach(stickItem);
        observer.observe(chatItems, { childList: true });
    };

    let setUpCss = () => {
        let style = document.createElement('style');
        document.head.appendChild(style);
        style.sheet.insertRule('#sticky {position: relative;}');
        style.sheet.insertRule('#sticky #overflow {position: absolute; right: 16px; top: 3px; visibility: visible; padding: 0; z-index: 1; height: 25px; width: 25px;}');
        style.sheet.insertRule('#sticky #chat-header {box-sizing: border-box; display: flex; border-bottom: #e0e0e0 solid 1px; background-color: #fffffffa; height: 150px; padding: 0 0 0 4px; transition: all .15s cubic-bezier(0.0, 0.0, 0.2, 1);}');
        style.sheet.insertRule('#sticky yt-icon-button {z-index: 0; transition: all .15s cubic-bezier(0.0, 0.0, 0.2, 1); visibility: hidden;}');
        style.sheet.insertRule('#sticky #primary-content {height: inherit; overflow-x: hidden;}');
        style.sheet.insertRule('#sticky #primary-content::-webkit-scrollbar {content: "";}');
        style.sheet.insertRule('#sticky #primary-content::-webkit-scrollbar-track {background-color: #f1f1f1;}');
        style.sheet.insertRule('#sticky #primary-content::-webkit-scrollbar-thumb {border: 2px solid #f1f1f1; min-height: 30px;}');
        style.sheet.insertRule('#sticky #primary-content .sticky-item {padding: 4px; font-size: 13px; display: flex;}');
        style.sheet.insertRule('#sticky #primary-content .sticky-item #author-photo {display: inline-table;}');
        style.sheet.insertRule('#sticky #primary-content .sticky-item #img {max-width: inherit;}');
        style.sheet.insertRule('#sticky #primary-content .timestamp {display: inline; color: #11111166; font-size: 11px; margin-right: 8px;}');
        style.sheet.insertRule('#sticky #primary-content .author {display: inline-flex; margin-right: 8px;}');
        style.sheet.insertRule('#sticky #primary-content .author .author-name {color: #11111199; font-weight: 500;}');
        style.sheet.insertRule('#sticky #primary-content .author .author-name.moderator {color: #5f84f1;}');
        style.sheet.insertRule('#sticky #primary-content .author .author-name.moderator.owner {color: #000000de; background-color: #ffd600; padding: 2px 4px; border-radius: 2px;}');
        style.sheet.insertRule('#sticky #primary-content #message {display: inline; line-height: 17px;}');
        style.sheet.insertRule('#sticky.dark #chat-header {border-color: #303030; background-color: #202020;}');
        style.sheet.insertRule('#sticky.dark #primary-content::-webkit-scrollbar-track {background-color: #0f0f0f;}');
        style.sheet.insertRule('#sticky.dark #primary-content::-webkit-scrollbar-thumb {background-color: hsla(0, 0%, 53.3%, .2); border-color: #0f0f0f;');
        style.sheet.insertRule('#sticky.dark #primary-content .timestamp {color: #ffffff8a;}');
        style.sheet.insertRule('#sticky.dark #primary-content .author .author-name {color: #ffffffb3;}');
        style.sheet.insertRule('#sticky.dark #primary-content .author .author-name.moderator {color: #5e84f1;}');
        style.sheet.insertRule('#sticky.dark #primary-content .author .author-name.moderator.owner {color: #111111;}');
        style.sheet.insertRule('#sticky.hide-timestamps #primary-content .timestamp {display: none;}');
    };

    let initMonitoring = () => {
        setUpCss();
        setUpSticky();
        monitor();
    };

    let init = () => {
        if (window.top.document.readyState === 'complete') {
            initMonitoring();
        } else {
            window.top.addEventListener('load', initMonitoring);
        }
    };

    init();
})();