# Changelog

## [0.3.0](https://github.com/iriss22/ai-for-developers-project-387/compare/v0.2.0...v0.3.0) (2026-11-17)


### Features

* **ci:** артефакт браузерной проверки с head SHA и сверка перед мерджем ([#22](https://github.com/iriss22/ai-for-developers-project-387/issues/22)) ([a441469](https://github.com/iriss22/ai-for-developers-project-387/commit/a4414694d09088173236917053787389221d024a))
* **ci:** общий бюджет запусков агента на PR с отказом limit_exhausted ([#22](https://github.com/iriss22/ai-for-developers-project-387/issues/22)) ([2684206](https://github.com/iriss22/ai-for-developers-project-387/commit/2684206cab080ef35516cefa568aedd542ecb538))


### Bug Fixes

* **ci:** задать GH_REPO в report-джобе opencode ([#22](https://github.com/iriss22/ai-for-developers-project-387/issues/22)) ([e5a2785](https://github.com/iriss22/ai-for-developers-project-387/commit/e5a2785051d1d3ce4433e3d99862fac7d7f80210))
* **ci:** исправить опечатку в SHA пина actions/checkout ([#22](https://github.com/iriss22/ai-for-developers-project-387/issues/22)) ([83c8aa5](https://github.com/iriss22/ai-for-developers-project-387/commit/83c8aa554f6ac08c4a806e88a3d4e6d0e2dba4ea))
* **ci:** маркер бюджета в артефакте вместо run-name ([#22](https://github.com/iriss22/ai-for-developers-project-387/issues/22)) ([153b9c5](https://github.com/iriss22/ai-for-developers-project-387/commit/153b9c570b1e11ce84c44f2c4d38150b298a6275))
* **ci:** маркер бюджета вне репозитория — не мешает checkout агента ([#22](https://github.com/iriss22/ai-for-developers-project-387/issues/22)) ([5fda9c8](https://github.com/iriss22/ai-for-developers-project-387/commit/5fda9c818a6b510dc1bb42827995e878be4ea7a3))
* **ci:** не публиковать итог когда джоба агента skipped ([#22](https://github.com/iriss22/ai-for-developers-project-387/issues/22)) ([948f09f](https://github.com/iriss22/ai-for-developers-project-387/commit/948f09f60d894aca32b65e9da5dbf716dcab27e4))
* **ci:** опечатка в SHA пина actions/upload-artifact ([#22](https://github.com/iriss22/ai-for-developers-project-387/issues/22)) ([3ca0bbb](https://github.com/iriss22/ai-for-developers-project-387/commit/3ca0bbb3dc2afe9b9c053f79fc68d59250cfc614))
* **ci:** передача аргументов oc-budget.sh — блок вместо plain-скаляра ([#22](https://github.com/iriss22/ai-for-developers-project-387/issues/22)) ([13f8f33](https://github.com/iriss22/ai-for-developers-project-387/commit/13f8f3310b2d7846eb97f5cd424c4897aaec9675))
* **ci:** поднять таймаут авторевью до 90 минут ([#22](https://github.com/iriss22/ai-for-developers-project-387/issues/22)) ([161b224](https://github.com/iriss22/ai-for-developers-project-387/commit/161b22406d3e2462ccccb5cfc5ecc06e9b56ea05))
* **ci:** принимать человеческое ревью при исчерпании бюджета ([#16](https://github.com/iriss22/ai-for-developers-project-387/issues/16)) ([#26](https://github.com/iriss22/ai-for-developers-project-387/issues/26)) ([300aec0](https://github.com/iriss22/ai-for-developers-project-387/commit/300aec0172744897aae6e9f9940e499de9eea65e))
* **ci:** сверка браузерной проверки после ревью — без гонки с CI ([#22](https://github.com/iriss22/ai-for-developers-project-387/issues/22)) ([cf92a7e](https://github.com/iriss22/ai-for-developers-project-387/commit/cf92a7ea90a0ff8bf1ab516d598f348294d2e6ef))
* **ci:** склеивание номера issue/PR в run-name вместо || ([#22](https://github.com/iriss22/ai-for-developers-project-387/issues/22)) ([f026f91](https://github.com/iriss22/ai-for-developers-project-387/commit/f026f917a4c3e39bbd6126fe74eb7d1ff0a561ef))
* **ci:** точное сопоставление run-name с номером issue в счётчике бюджета ([#22](https://github.com/iriss22/ai-for-developers-project-387/issues/22)) ([f880707](https://github.com/iriss22/ai-for-developers-project-387/commit/f880707bb4b97ced14f74f86d5bde22c541d19e1))
* **ci:** триаж только для доверенных авторов по списку из переменной ([#6](https://github.com/iriss22/ai-for-developers-project-387/issues/6)) ([bcc0122](https://github.com/iriss22/ai-for-developers-project-387/commit/bcc01221a6e9a380ee3543265c7334550a18002b))

## [0.2.0](https://github.com/iriss22/ai-for-developers-project-387/compare/v0.1.0...v0.2.0) (2026-11-15)

### Features

* **ci:** агентский разбор отчёта OSV с issue по находкам ([#6](https://github.com/iriss22/ai-for-developers-project-387/issues/6)) ([1dcc796](https://github.com/iriss22/ai-for-developers-project-387/commit/1dcc7960aec94f423a02d3ab424a019ecae9a67e))
* **ci:** добавить workflow OpenCode для комментариев ([#3](https://github.com/iriss22/ai-for-developers-project-387/issues/3)) ([7c6ab90](https://github.com/iriss22/ai-for-developers-project-387/commit/7c6ab90c6f983edd8cae55532d7e4c8e68d35ba3))
* **ci:** ревьюить PR агента, исключая служебных ботов ([#13](https://github.com/iriss22/ai-for-developers-project-387/issues/13)) ([ad8c0af](https://github.com/iriss22/ai-for-developers-project-387/commit/ad8c0afe8edf1cc57d8768b1f25ce1912b2d26cc))
* добавить автотриаж новых обращений ([#7](https://github.com/iriss22/ai-for-developers-project-387/issues/7)) ([5cd1c1b](https://github.com/iriss22/ai-for-developers-project-387/commit/5cd1c1b273c480dd859d32f3e8936d99cc5dd901))
* добавить независимое авторевью PR с лимитом запусков ([#13](https://github.com/iriss22/ai-for-developers-project-387/issues/13)) ([b552124](https://github.com/iriss22/ai-for-developers-project-387/commit/b552124c0b81ebee8a136e0a4be66e9cbc9e7bb6))
* перенести приложение и инструменты из проекта 386 ([#1](https://github.com/iriss22/ai-for-developers-project-387/issues/1)) ([133fd44](https://github.com/iriss22/ai-for-developers-project-387/commit/133fd44230fe251e1c4a855c5fdbe5d0c65721d0))

### Bug Fixes

* **ci:** opencode CLI и корректный отчёт OSV в аудите ([#6](https://github.com/iriss22/ai-for-developers-project-387/issues/6)) ([06522f8](https://github.com/iriss22/ai-for-developers-project-387/commit/06522f82e7747e677e796426887748aa490b990f))
* **ci:** sha checkout в воркфлоу аудита ([#6](https://github.com/iriss22/ai-for-developers-project-387/issues/6)) ([bc0af48](https://github.com/iriss22/ai-for-developers-project-387/commit/bc0af486c4f87a08f1cde171aedca80b76c2b2ab))
* **ci:** задать агенту OpenCode обязательные правила репозитория ([#6](https://github.com/iriss22/ai-for-developers-project-387/issues/6)) ([25a3d72](https://github.com/iriss22/ai-for-developers-project-387/commit/25a3d72100e7c4b22c2abebbe280a9358237b18d))
* **ci:** использовать доступную на free-тарифе модель kimi-k3.1-pro ([#4](https://github.com/iriss22/ai-for-developers-project-387/issues/4)) ([212c585](https://github.com/iriss22/ai-for-developers-project-387/commit/212c585aff61cdf8dd69ca76a5a0d25e324de6f9))
* **ci:** исправить id модели OpenCode на moonshotai/kimi-k2.7-code ([#5](https://github.com/iriss22/ai-for-developers-project-387/issues/5)) ([4b89c24](https://github.com/iriss22/ai-for-developers-project-387/commit/4b89c2467597dcdbfc4a3db83f8e19060f542f21))
* **ci:** не тратить лимит ревью на служебные прогоны ([#13](https://github.com/iriss22/ai-for-developers-project-387/issues/13)) ([7a7d0d4](https://github.com/iriss22/ai-for-developers-project-387/commit/7a7d0d4ce4ee440170a8f4083a3d33f66abba2f1))
* **ci:** оставить в правилах агента только формат коммитов ([#6](https://github.com/iriss22/ai-for-developers-project-387/issues/6)) ([0945fe5](https://github.com/iriss22/ai-for-developers-project-387/commit/0945fe514b428b4e98f690cb70a7853785c22562))
* **ci:** поднять тайм-аут OpenCode до 90 минут ([#6](https://github.com/iriss22/ai-for-developers-project-387/issues/6)) ([350688f](https://github.com/iriss22/ai-for-developers-project-387/commit/350688f77d8f59257dfc75f95d130f42695facde))
* **ci:** увеличить тайм-аут OpenCode до 60 минут ([#6](https://github.com/iriss22/ai-for-developers-project-387/issues/6)) ([aa72cd8](https://github.com/iriss22/ai-for-developers-project-387/commit/aa72cd8f52d8e5b8280bb832f8d84b10d13834cb))
* **ci:** уточнить причину 404 kimi-k2.7-code в комментарии workflow ([#4](https://github.com/iriss22/ai-for-developers-project-387/issues/4)) ([aed51fc](https://github.com/iriss22/ai-for-developers-project-387/commit/aed51fc847f22427beb81b95842dc26b2e7a4f7f))
