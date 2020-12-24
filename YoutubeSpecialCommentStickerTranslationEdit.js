// ==UserScript==
// @name         YoutubeSpecialCommentStickerTranslationEdit
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.youtube.com/live_chat*
// @grant        none
// ==/UserScript==

(() => {
    let IS_DARK = document.querySelector('html').hasAttribute('dark');
    let CHAT_ID = document.location.href.indexOf('popout') > -1 ? document.location.href.split('=')[2] : document.location.href.split('=')[1].slice(8, 120);

    let canScroll = true;
    let chat;
    let chatSettingsButton;
    let chatSettingsStickyButton;
    let itemScroller;
    let scrollButton;
    let settings;
    let settingsButton;
    let settingsData;
    let sticky;
    let stickyItemObjects;
    let stickyItemObjectsMap;
    let stickyItems;
    let stickyItemsContainer;
    let toggleSticky;
    let toggleStickyText;
    let blacklist;
    let whitelist;
    let moderator;
    let owner;
    let cancel;
    let save;

    let showSticky = () => {
        if (sticky.style.display === 'none') {
            chat = document.querySelector('#chat');
            itemScroller = chat.querySelector('#item-scroller');
            sticky.style.display = 'inherit';
            chat.setAttribute('style', `max-height: ${chat.offsetHeight - sticky.offsetHeight}px;`);
            itemScroller.scrollTop = itemScroller.scrollHeight;
        }
    };

    let scrollSticky = () => {
        if (canScroll) {
            stickyItems.scrollTop = stickyItems.scrollHeight;
        }
    };

    let isSpecial = (author) => {
        if (settingsData.blacklist && settingsData.blacklist.indexOf(author.innerText ? author.innerText : author.content.author.name) > -1) {
            return false;
        } else if (settingsData.whitelist && settingsData.whitelist.indexOf(author.innerText ? author.innerText : author.content.author.name) === -1) {
            return false;
        } else if (settingsData.moderator) {
            return author.classList ? (author.classList.contains('moderator') || author.classList.contains('owner')) : author.content.author.classes.indexOf('moderator') > -1;
        } else if (settingsData.owner) {
            return author.classList ? author.classList.contains('owner') : author.content.author.classes.indexOf('owner') > -1;
        }
        return true;
    };

    let isTranslation = (text) => {
        let pattern = /(^\/?(英訳|英訳\/en|en|tr|translation|korone|pol)(\s?:|\s?-|\})\s|^\/?\[(英訳|英訳\/en|en|tr|translation|korone|pol)\])/i;

        return pattern.test(text);
    };

    let isUnique = (node) => {
        return !stickyItemObjectsMap[`${node.querySelector('#timestamp').innerText}-${node.querySelector('#author-name').innerText}-${node.querySelector('#message').innerText}`];
    };

    let saveStickyItem = (stickyItem) => {
        let stickyItemObject = {
            authorPhoto: {
                img: {
                    src: stickyItem.querySelector('#img').getAttribute('src')
                }
            },
            content: {
                timestamp: stickyItem.querySelector('.timestamp').innerText,
                author: {
                    classes: stickyItem.querySelector('.author-name').getAttribute('class').replace('author-name ', ''),
                    name: stickyItem.querySelector('.author-name').innerText
                },
                message: Array.from(stickyItem.querySelector('#message').childNodes).reduce((result, node) => {
                    if (node.nodeName === '#text') {
                        result.push({
                            type: 'text',
                            value: node.data
                        });
                    } else if (node.nodeName === 'IMG') {
                        result.push({
                            type: 'image',
                            value: {
                                alt: node.alt,
                                src: node.src
                            }
                        });
                    } else if (node.nodeName === 'A') {
                        result.push({
                            type: 'link',
                            value: {
                                href: node.href,
                                text: node.innerText
                            }
                        });
                    }
                    return result;
                }, [])
            }
        };
        stickyItemObjects.push(stickyItemObject);
        localStorage.setItem(`youtubespecialcommentsticker-sticky-items-${CHAT_ID}`, JSON.stringify(stickyItemObjects));
    };

    let stickItem = (node) => {
        let authorElement = node.querySelector('#author-name');

        if (authorElement && (isSpecial(authorElement) || isTranslation(node.querySelector('#message').innerText.trim())) && isUnique(node)) {
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

            showSticky();
            scrollSticky();
            saveStickyItem(stickyItem);
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
        style.sheet.insertRule('#sticky #settings {outline: none; position: absolute; z-index: 1; right: 8px; top: 30px;}');
        style.sheet.insertRule('#sticky #settings #items {padding: 8px 0px;}');
        style.sheet.insertRule('#sticky #settings #items ytd-menu-service-item-renderer {cursor: default;}');
        style.sheet.insertRule('#sticky #settings paper-item.disabled {opacity: 0.5;}');
        style.sheet.insertRule('#sticky #settings paper-item.disabled yt-live-chat-text-input-field-renderer #input {visibility: hidden;}');
        style.sheet.insertRule('#sticky #settings paper-item {padding: 0px 16px;}');
        style.sheet.insertRule('#sticky #settings paper-item:hover, #sticky #settings paper-item:focus:before {background-color: transparent;}');
        style.sheet.insertRule('#sticky #settings paper-item > *:not(:first-child):not(:nth-child(2)) {margin-left: 5px;}');
        style.sheet.insertRule('#sticky #settings paper-item yt-formatted-string {user-select: none;}');
        style.sheet.insertRule('#sticky #settings paper-item yt-live-chat-text-input-field-renderer {width: 180px; color: var(--yt-live-chat-primary-text-color);}');
        style.sheet.insertRule('#sticky #settings #blacklist yt-formatted-string, #sticky #settings #whitelist yt-formatted-string {width: 60px;}');
        style.sheet.insertRule('#sticky #settings #types, #sticky #settings #controls {align-items: flex-end;}');
        style.sheet.insertRule('#sticky #settings #controls paper-button {line-height: initial; padding: 5px 11px 5px 11px;}');
        style.sheet.insertRule('#sticky #settings #controls #cancel paper-button {padding: 4px 11px 4px 11px;}');
        style.sheet.insertRule('#sticky #settings #toggle {display: flex; flex-direction: row; align-items: center; cursor: pointer;}');
        style.sheet.insertRule('#sticky #settings #toggle[checked]:not([disabled]) .toggle-bar.paper-toggle-button {opacity: 0.5; background-color: var(--paper-toggle-button-checked-bar-color, var(--primary-color));}');
        style.sheet.insertRule('#sticky #settings #toggle[checked]:not([disabled]) .toggle-button.paper-toggle-button {background-color: var(--paper-toggle-button-checked-button-color, var(--primary-color));}');
        style.sheet.insertRule('#sticky #settings #toggle[checked] .toggle-button.paper-toggle-button {transform: translate(16px, 0);}');
        style.sheet.insertRule('#sticky #settings #toggle .toggle-container.paper-toggle-button {display: inline-block; position: relative; width: 36px; height: 14px; margin: 4px 1px;}');
        style.sheet.insertRule('#sticky #settings #toggle .toggle-bar.paper-toggle-button {position: absolute; height: 100%; width: 100%; border-radius: 8px; pointer-events: none; opacity: 0.4; transition: background-color linear .08s; background-color: var(--paper-toggle-button-unchecked-bar-color, #000000);}');
        style.sheet.insertRule('#sticky #settings #toggle .toggle-button.paper-toggle-button {position: absolute; top: -3px; left: 0; right: auto; height: 20px; width: 20px; border-radius: 50%; box-shadow: 0 1px 5px 0 rgba(0, 0, 0, 0.6); transition: transform linear .08s, background-color linear .08s; will-change: transform; background-color: var(--paper-toggle-button-unchecked-button-color, var(--paper-grey-50));}');
        style.sheet.insertRule('#sticky #show-hide-button {border-bottom: #e0e0e0 solid 1px; font-size: 11px;}');
        style.sheet.insertRule('#sticky #show-hide-button div {font-size: 11px;}');
        style.sheet.insertRule('#sticky #show-hide-button div a {color: #11111199; display: flex;}');
        style.sheet.insertRule('#sticky #show-hide-button div a:hover {color: #030303;}');
        style.sheet.insertRule('#sticky #show-hide-button div a #button {border-radius: 0; margin: 0; padding: 8px 24px; width: 100%;}');
        style.sheet.insertRule('#sticky #show-hide-button div a #button #text {font-weight: 500;}');
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
        style.sheet.insertRule('#sticky.dark #show-hide-button {border-color: #303030; background-color: #181818;}');
        style.sheet.insertRule('#sticky.dark #show-hide-button div a {color: #ffffffb3;}');
        style.sheet.insertRule('#sticky.dark #show-hide-button div a:hover {color: #ffffff;}');
        style.sheet.insertRule('#sticky.dark #chat-header {border-color: #303030; background-color: #202020;}');
        style.sheet.insertRule('#sticky.dark #primary-content::-webkit-scrollbar-track {background-color: #0f0f0f;}');
        style.sheet.insertRule('#sticky.dark #primary-content::-webkit-scrollbar-thumb {background-color: hsla(0, 0%, 53.3%, .2); border-color: #0f0f0f;');
        style.sheet.insertRule('#sticky.dark #primary-content .timestamp {color: #ffffff8a;}');
        style.sheet.insertRule('#sticky.dark #primary-content .author .author-name {color: #ffffffb3;}');
        style.sheet.insertRule('#sticky.dark #primary-content .author .author-name.moderator {color: #5e84f1;}');
        style.sheet.insertRule('#sticky.dark #primary-content .author .author-name.moderator.owner {color: #111111;}');
        style.sheet.insertRule('#sticky.hide-timestamps #primary-content .timestamp {display: none;}');
    };

    let setUpSettingsItemsStates = (open) => {
        if ((!open && settingsData.blacklist) || blacklist.querySelector('#input > div').innerText.trim()) {
            whitelist.classList.add('disabled');
        } else {
            whitelist.classList.remove('disabled');
        }
        if ((!open && settingsData.whitelist) || whitelist.querySelector('#input > div').innerText.trim()) {
            blacklist.classList.add('disabled');
        } else {
            blacklist.classList.remove('disabled');
        }
    };

    let setUpSettingsItems = () => {
        let items = settings.querySelector('#items');
        let types;
        let controls;

        chatSettingsButton = document.querySelector('#chat-messages #overflow');

        ['blacklist', 'whitelist', 'types', 'controls'].forEach((id) => {
            items.innerHTML += `<ytd-menu-service-item-renderer id="${id}" class="style-scope ytd-menu-popup-renderer" role="menuitem" tabindex="-1" aria-selected="false" data='{"serviceEndpoint": {}}'></ytd-menu-service-item-renderer>`;
        });

        blacklist = items.querySelector('#blacklist paper-item');
        blacklist.innerHTML += `<yt-live-chat-text-input-field-renderer id="input" class="style-scope yt-live-chat-message-input-renderer" disabled="" emoji-manager='{"emojiShortcutMap": {}}'></yt-live-chat-text-input-field-renderer>`;
        blacklist.querySelector('yt-formatted-string').innerText = 'Blacklist';
        blacklist.querySelector('#input > div').innerText = settingsData.blacklist;

        whitelist = items.querySelector('#whitelist paper-item');
        whitelist.innerHTML += '<yt-live-chat-text-input-field-renderer id="input" class="style-scope yt-live-chat-message-input-renderer" disabled=""></yt-live-chat-text-input-field-renderer>';
        whitelist.querySelector('yt-formatted-string').innerText = 'Whitelist';
        whitelist.querySelector('#input > div').innerText = settingsData.whitelist;

        types = items.querySelector('#types paper-item');
        types.innerHTML += '<div id="toggle" class="style-scope ytd-compact-autoplay-renderer" role="button" checked=""><div class="toggle-container style-scope paper-toggle-button"><div id="toggleBar" class="toggle-bar style-scope paper-toggle-button"></div><div id="toggleButton" class="toggle-button style-scope paper-toggle-button"></div></div></div>';
        types.append(types.querySelector('yt-formatted-string').cloneNode());
        types.innerHTML += '<div id="toggle" class="style-scope ytd-compact-autoplay-renderer" role="button" checked=""><div class="toggle-container style-scope paper-toggle-button"><div id="toggleBar" class="toggle-bar style-scope paper-toggle-button"></div><div id="toggleButton" class="toggle-button style-scope paper-toggle-button"></div></div></div>';
        types.querySelector('yt-formatted-string').innerText = 'Moderators';
        types.querySelector('yt-formatted-string:nth-of-type(2)').innerText = 'Owner';
        moderator = types.querySelector('#toggle');
        owner = types.querySelector('#toggle:nth-of-type(2)');
        settingsData.moderator ? moderator.setAttribute('checked', '') : moderator.removeAttribute('checked');
        settingsData.owner ? owner.setAttribute('checked', '') : owner.removeAttribute('checked');

        controls = items.querySelector('#controls paper-item');
        controls.innerHTML += '<ytd-button-renderer id="cancel" class="style-scope ytd-masthead style-suggestive size-small" button-renderer="" use-keyboard-focused="" is-paper-button-with-icon="" is-paper-button=""></ytd-button-renderer>';
        controls.innerHTML += '<ytd-button-renderer id="save" class="style-scope ytd-video-secondary-info-renderer style-destructive size-default" button-renderer="" use-keyboard-focused="" is-paper-button-with-icon="" is-paper-button=""></ytd-button-renderer>';
        cancel = controls.querySelector('#cancel');
        save = controls.querySelector('#save');
        cancel.innerHTML = '<paper-button id="button" class="style-scope ytd-button-renderer style-suggestive size-small" role="button" tabindex="0" animated="" elevation="0" aria-disabled="false" aria-label="Sign in"><yt-formatted-string id="text" class="style-scope ytd-button-renderer style-suggestive size-small"></yt-formatted-string></paper-button>';
        save.innerHTML = '<paper-button id="button" class="style-scope ytd-button-renderer style-destructive size-default" role="button" tabindex="0" animated="" elevation="0" aria-disabled="false" aria-label="Subscribe"><yt-formatted-string id="text" class="style-scope ytd-button-renderer style-destructive size-default"></yt-formatted-string></paper-button>';
        cancel.querySelector('yt-formatted-string').innerText = 'Cancel';
        save.querySelector('yt-formatted-string').innerText = 'Save';

        setUpSettingsItemsStates();
    };

    let setUpSettingsData = () => {
        let savedSettingsData = localStorage.getItem('youtubespecialcommentsticker-settings');
        if (savedSettingsData) {
            settingsData = JSON.parse(savedSettingsData);
        } else {
            settingsData = {
                blacklist: '',
                whitelist: '',
                moderator: true,
                owner: true
            };
        }
    };

    let setUpSettings = () => {
        setUpSettingsData();
        setUpSettingsItems();
    };

    let stickSavedItem = (savedItem) => {
        if (isSpecial(savedItem)) {
            let stickyItem = document.createElement('div');
            let message = savedItem.content.message.reduce((result, node) => {
                if (node.type === 'text') {
                    result += node.value;
                } else if (node.type === 'image') {
                    result += `<img class="emoji style-scope yt-live-chat-text-message-renderer" src="${node.value.src}" alt="${node.value.alt}">`;
                } else {
                    result += `<a class="yt-simple-endpoint style-scope yt-live-chat-text-message-renderer" href="${node.value.href}" rel="nofollow" target="_blank">${node.value.text}</a>`;
                }
                return result;
            }, '');
            stickyItem.classList.add('sticky-item');
            stickyItem.innerHTML = `<div id="author-photo" class="no-transition style-scope yt-live-chat-text-message-renderer" height="24" width="24" style="background-color: transparent;"><img id="img" class="style-scope yt-img-shadow" alt="" height="24" width="24" src="${savedItem.authorPhoto.img.src}"></div>`;
            stickyItem.innerHTML += `<div id="content" class="style-scope yt-live-chat-text-message-renderer"><span class="timestamp">${savedItem.content.timestamp}</span><div class="author"><span class="author-name ${savedItem.content.author.classes}">${savedItem.content.author.name}</span></div><span id="message" dir="auto" class="style-scope yt-live-chat-text-message-renderer">${message}</span></div>`;
            stickyItems.append(stickyItem);
            stickyItemObjectsMap[`${savedItem.content.timestamp}-${savedItem.content.author.name}-${stickyItem.querySelector('#message').innerText}`] = true;
            showSticky();
            scrollSticky();
        }
    };

    let setUpSavedStickyItems = () => {
        let savedStickyItems = localStorage.getItem(`youtubespecialcommentsticker-sticky-items-${CHAT_ID}`);
        stickyItemObjectsMap = {};
        stickyItemObjects = savedStickyItems ? JSON.parse(savedStickyItems) : [];
        stickyItemObjects.forEach(stickSavedItem);
    };

    let setUpSticky = () => {
        let hideTimestamp = document.querySelector('yt-live-chat-renderer').hasAttribute('hide-timestamps');
        let stickyAnchor = document.querySelector('yt-live-chat-app');
        sticky = document.createElement('div');

        sticky.id = 'sticky';
        sticky.setAttribute('class', `style-scope ytd-watch-flexy ${IS_DARK ? 'dark' : ''} ${hideTimestamp ? 'hide-timestamps': ''}`);
        sticky.style.display = 'none';
        sticky.innerHTML = '<yt-icon-button id="overflow" class="style-scope yt-live-chat-header-renderer"><button id="button" class="style-scope yt-icon-button"><yt-icon icon="more_vert" class="style-scope yt-live-chat-header-renderer"><svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" class="style-scope yt-icon" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g class="style-scope yt-icon"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" class="style-scope yt-icon"></path></g></svg></yt-icon></button><paper-ripple class="style-scope yt-icon-button circle"><div id="background" class="style-scope paper-ripple" style="opacity: 0;"></div><div id="waves" class="style-scope paper-ripple"></div></paper-ripple></yt-icon-button>';
        sticky.innerHTML += '<div id="settings" horizontal-align="auto" vertical-align="top" aria-disabled="false" class="style-scope yt-live-chat-app" prevent-autonav="true" style="display: none;" aria-hidden="true" tabindex="0"><div id="contentWrapper" class="style-scope iron-dropdown"><ytd-menu-popup-renderer slot="dropdown-content" class="style-scope yt-live-chat-app" tabindex="-1" use-icons_=""></ytd-menu-popup-renderer></div></div>';
        sticky.innerHTML += '<div id="show-hide-button" class="style-scope ytd-live-chat-frame"><div class="style-scope ytd-live-chat-frame" use-keyboard-focused="" is-paper-button="" button-renderer="true"><a class="yt-simple-endpoint style-scope ytd-toggle-button-renderer" tabindex="-1"><paper-button id="button" class="style-scope ytd-toggle-button-renderer" role="button" tabindex="0" animated="" elevation="0" aria-disabled="false"><yt-formatted-string id="text" class="style-scope ytd-toggle-button-renderer"></yt-formatted-string><paper-ripple class="style-scope paper-button"><div id="background" class="style-scope paper-ripple"></div><div id="waves" class="style-scope paper-ripple"></div></paper-ripple></paper-button></a></div></div>'
        sticky.innerHTML += '<div id="chat-header" role="heading" class="style-scope yt-live-chat-renderer"><div id="primary-content" class="style-scope yt-live-chat-header-renderer"></div>';
        sticky.innerHTML += '<yt-icon-button id="show-more" class="style-scope yt-live-chat-item-list-renderer" style="transform: translateY(42px);"><button id="button" class="style-scope yt-icon-button"><button id="button" class="style-scope yt-icon-button" aria-label="More comments below"><yt-icon icon="down_arrow" class="style-scope yt-live-chat-item-list-renderer"><svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" class="style-scope yt-icon" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g class="style-scope yt-icon"><path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" class="style-scope yt-icon"></path></g></svg></yt-icon></button></button><paper-ripple class="style-scope yt-icon-button circle"><div id="background" class="style-scope paper-ripple" style="opacity: 0.006272;"></div><div id="waves" class="style-scope paper-ripple"></div></paper-ripple></yt-icon-button>'
        settings = sticky.querySelector('#settings');
        settingsButton = sticky.querySelector('#overflow');
        stickyItemsContainer = sticky.querySelector('#chat-header');
        toggleSticky = sticky.querySelector('#show-hide-button');
        toggleStickyText = toggleSticky.querySelector('#text');
        scrollButton = sticky.querySelector('#show-more');
        scrollButton.querySelector('#button').style.height = 'auto';

        stickyAnchor.parentNode.insertBefore(sticky, stickyAnchor);
        stickyAnchor.style.position = 'relative';
        toggleStickyText.innerText = 'Hide Sticky';

        sticky.querySelectorAll('#title, #view-selector, #action-buttons, #items, #footer').forEach(element => element.parentNode.removeChild(element));
        stickyItems = sticky.querySelector('#primary-content');
        settings.querySelector('ytd-menu-popup-renderer').innerHTML = '<div id="items" class="style-scope ytd-menu-popup-renderer" role="listbox" tabindex="0"></div>';

        setUpSettings();
        setUpSavedStickyItems();
    };

    let monitorDarkTheme = () => {
        let observer = new MutationObserver(() => {
            sticky.classList.toggle('dark');
        });
        observer.observe(document.querySelector('html'), {
            attributes: true,
            attributeFilter: ['dark']
        });
    };

    let monitorTimestampToggle = () => {
        let observer = new MutationObserver(() => {
            sticky.classList.toggle('hide-timestamps');
            scrollSticky();
        });
        observer.observe(document.querySelector('yt-live-chat-renderer'), {
            attributes: true,
            attributeFilter: ['hide-timestamps']
        });
    };

    let monitorSettings = () => {
        let config = {
            characterData: true,
            subtree: true
        };
        let blacklistObserver = new MutationObserver((mutations) => {
            if (mutations[0].target.data) {
                whitelist.classList.add('disabled');
            } else {
                whitelist.classList.remove('disabled');
            }
        });
        let whitelistObserver = new MutationObserver((mutations) => {
            if (mutations[0].target.data) {
                blacklist.classList.add('disabled');
            } else {
                blacklist.classList.remove('disabled');
            }
        });
        blacklistObserver.observe(blacklist, config);
        whitelistObserver.observe(whitelist, config);
    };

    let restoreSettingsData = () => {
        blacklist.querySelector('#input > div').innerText = settingsData.blacklist;
        whitelist.querySelector('#input > div').innerText = settingsData.whitelist;
        settingsData.moderator ? moderator.setAttribute('checked', '') : moderator.removeAttribute('checked');
        settingsData.owner ? owner.setAttribute('checked', '') : owner.removeAttribute('checked');
        settings.style.display = 'none';
    };

    let handlePaste = (element) => {
        let paste = event.clipboardData.getData('Text');
        let selection = window.getSelection();
        let position = selection.anchorOffset;
        element.innerText = `${element.innerText.slice(0, position)}${paste}${element.innerText.slice(position)}`;
        selection.collapse(element.lastChild, position + paste.length);
    };

    let filterStickyItems = () => {
        Array.from(stickyItems.children).forEach((stickyItem) => {
            if (!isSpecial(stickyItem.querySelector('.author-name'))){
                stickyItem.setAttribute('style', 'display: none;');
            } else {
                stickyItem.removeAttribute('style');
            }
        });
    };

    let setUpEvents = () => {
        stickyItems.addEventListener('scroll', () => {
            setTimeout(() => {
                canScroll = stickyItems.scrollHeight - stickyItems.scrollTop === stickyItems.clientHeight;
                scrollButton.style.transform = `translateY(${canScroll ? 42 : 0}px)`;
                scrollButton.style.visibility = canScroll ? 'hidden' : 'visible';
            });
        });
        scrollButton.addEventListener('click', () => {
            canScroll = true;
            stickyItems.scrollTop = stickyItems.scrollHeight;
        });
        toggleSticky.addEventListener('click', () => {
            if (stickyItemsContainer.offsetHeight > 0) {
                chat.setAttribute('style', `max-height: ${chat.offsetHeight + 150}px;`);
                toggleStickyText.innerText = 'Show Sticky';
                stickyItemsContainer.setAttribute('style', 'border: none;');
                stickyItemsContainer.style.height = '0px';
            } else {
                chat.setAttribute('style', `max-height: ${chat.offsetHeight - 150}px;`);
                itemScroller.scrollTop += 150;
                toggleStickyText.innerText = 'Hide Sticky';
                stickyItemsContainer.setAttribute('style', '');
                stickyItemsContainer.style.height = '150px';
            }
        });
        chatSettingsButton.addEventListener('click', () => {
            if (!chatSettingsStickyButton && sticky.style.display === 'none') {
                let chatSettings = document.querySelector('yt-live-chat-app > iron-dropdown #items');
                chatSettingsStickyButton = document.createElement('div');
                chatSettingsStickyButton.innerHTML = `<ytd-menu-service-item-renderer class="style-scope ytd-menu-popup-renderer" role="menuitem" use-icons="" tabindex="-1" aria-selected="false" data='{"text": {"runs": [{"text":"Show Sticky"}]}, "icon": {"iconType": "PLAYLIST_ADD_CHECK"}, "serviceEndpoint": {}}'></ytd-menu-service-item-renderer>`;
                chatSettingsStickyButton = chatSettingsStickyButton.firstChild;
                chatSettings.append(chatSettingsStickyButton);
                chatSettingsStickyButton.addEventListener('click', () => {
                    chatSettingsButton.click();
                    showSticky();
                    chatSettingsStickyButton.style.display = 'none';
                });
            }
        });
        settingsButton.addEventListener('click', () => {
            settings.style.display = settings.style.display === 'none' ? 'initial' : 'none';
            if (settings.style.display === 'initial') {
                settings.focus();
            }
        });
        settings.addEventListener('focusout', (event) => {
            if (!settings.contains(event.relatedTarget)) {
                settings.style.display = 'none';
                restoreSettingsData();
                setUpSettingsItemsStates();
            }
        });
        blacklist.querySelector('#input > div').addEventListener('paste', () => {
            handlePaste(blacklist.querySelector('#input > div'));
            setUpSettingsItemsStates(true);
        });
        whitelist.querySelector('#input > div').addEventListener('paste', () => {
            handlePaste(whitelist.querySelector('#input > div'));
            setUpSettingsItemsStates(true);
        });
        settings.querySelectorAll('#toggle').forEach((toggle) => {
            toggle.addEventListener('click', (event) => {
                if (event.currentTarget.hasAttribute('checked')) {
                    event.currentTarget.removeAttribute('checked');
                } else {
                    event.currentTarget.setAttribute('checked', '');
                }
            });
        });
        cancel.addEventListener('click', () => {
            restoreSettingsData();
            setUpSettingsItemsStates();
        });
        save.addEventListener('click', () => {
            settingsData.blacklist = blacklist.querySelector('#input > div').innerText.trim();
            settingsData.whitelist = whitelist.querySelector('#input > div').innerText.trim();
            settingsData.moderator = moderator.hasAttribute('checked');
            settingsData.owner = owner.hasAttribute('checked');
            localStorage.setItem('youtubespecialcommentsticker-settings', JSON.stringify(settingsData));
            settings.style.display = 'none';
            filterStickyItems();
        });
    };

    let initMonitoring = () => {
        setUpCss();
        setUpSticky();
        monitor();
        monitorDarkTheme();
        monitorTimestampToggle();
        monitorSettings();
        setUpEvents();
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
