# YoutubeSpecialCommentStickerTranslationEdit
Edit of [Youtube Special Comment Sticker](https://gitgud.io/AsobiTaizen/youtubespecialcommentsticker) to include sticking realtime translations.

# What this is for?
Youtube Special Comment Sticker is a script for the [Tampermonkey Add-on](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) that adds a window to Youtube live stream chat that keeps messages left by the channel owner or moderators displayed.

This edit also adds chat messages left by people doing live translations to this window.

# How are live translations identified?
Currently I do a case insensitive check for messages that start with the following:

| EN | translation | tr | Korone | 英訳 | 英訳/EN
| -- | ----------- | -- | ------ | -- | -----
| `[EN]` | `[translation]` | `[tr]` | `[Korone]` | `[英訳]` | `[英訳/EN]`
| `EN:` | `translation:` | `tr:` | `Korone:` | `英訳:` | `英訳/EN:`
| `EN-` | `translation-` | `tr-` | `Korone-` | `英訳-` | `英訳/EN-`
| `EN -` | `translation -` | `tr -` | `Korone -` | `英訳 -` | `英訳/EN -`
| `/[EN]` | `/[translation]` | `/[tr]` | `/[Korone]` | `/[英訳]` | `/[英訳/EN]`
| `/EN:` | `/translation:` | `/tr:` | `/Korone:` | `/英訳:` | `/英訳/EN:`
| `/EN-` | `/translation-` | `/tr-` | `/Korone-` | `/英訳-` | `/英訳/EN-`
| `/EN -` | `/translation -` | `/tr -` | `/Korone -` | `/英訳 -` | `/英訳/EN -`