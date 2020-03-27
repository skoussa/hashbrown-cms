'use strict';

module.exports = (_, model, state) =>

_.div({class: 'resource-editor resource-editor--media-editor'},
    state.name === 'error' ? [
        _.div({class: 'widget widget--message centered warn'},
            state.message
        )
    
    ] : state.name === 'welcome' ? [
        _.div({class: 'resource-editor__welcome'},
            _.h1('Media'),
            _.p('Click any item in the panel to view it.'),
            _.p('Use the context menu (right click or the ', _.span({class: 'fa fa-ellipsis-v'}), ' button) to perform other actions.'),
            _.div({class: 'widget-group'},
                _.button({class: 'widget widget--button', onclick: _.onClickNew, title: 'Upload new media'}, 'Upload media'),
                _.button({class: 'widget widget--button', onclick: _.onClickStartTour, title: 'Start a tour of the UI'}, 'Quick tour')
            )
        )

    ] : [
        _.include(require('./inc/header')),
        _.div({class: 'resource-editor__body', name: 'body'},
            _.field({label: 'Filename'},
                _.text({disabled: model.isLocked, value: model.filename, onchange: _.onChangeFilename})
            ),
            _.field({label: 'Folder'},
                _.button({class: 'widget widget--button low nocaps', disabled: model.isLocked, onclick: _.onChangeFolder}, model.folder)
            ),
            _.field({label: 'Caption'},
                _.text({disabled: model.isLocked, value: model.caption, onchange: _.onChangeCaption})
            ),
            _.field({label: 'Author'},
                _.field({label: 'Name'},
                    _.text({disabled: model.isLocked, value: model.author.name, onchange: _.onChangeAuthorName})
                ),
                _.field({label: 'URL'},
                    _.text({disabled: model.isLocked, value: model.author.url, onchange: _.onChangeAuthorUrl})
                )
            ),
            _.field({label: 'Copyright'},
                _.field({label: 'Name'},
                    _.text({disabled: model.isLocked, value: model.copyrightHolder.name, onchange: _.onChangeCopyrightHolderName})
                ),
                _.field({label: 'URL'},
                    _.text({disabled: model.isLocked, value: model.copyrightHolder.url, onchange: _.onChangeCopyrightHolderUrl})
                ),
                _.field({label: 'Year'},
                    _.number({disabled: model.isLocked, value: model.copyrightYear, onchange: _.onChangeCopyrightYear})
                ),
            ),
            _.field({label: 'Source'},
                _.media({value: model.id, readonly: true})
            )
        ),
        _.div({class: 'resource-editor__footer'},
            _.include(require('./inc/warning')),
            _.div({class: 'resource-editor__footer__actions'},
                _.a({href: `#/${state.category}/${state.id}/json`, class: 'widget widget--button embedded'}, 'Advanced'),
                _.if(!model.isLocked,
                    _.button({class: 'widget widget--button', onclick: _.onClickSave}, 'Save')
                )
            )
        )
    ]
)
