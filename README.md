# YoutubeSpecialCommentStickerTranslationEdit
Edit of [Youtube Special Comment Sticker](https://gitgud.io/AsobiTaizen/youtubespecialcommentsticker) to include sticking realtime translations.

# What this is for?
Youtube Special Comment Sticker is a script for the [Tampermonkey Add-on](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) that adds a window to Youtube live stream chat that keeps messages left by the channel owner or moderators displayed.

This edit also adds chat messages left by people doing live translations to this window.

# How are live translations identified?
Currently I check for messages that start with the following:
- `[EN]`
- `EN-`
- `EN -`
- `EN:`
- `Translation:`