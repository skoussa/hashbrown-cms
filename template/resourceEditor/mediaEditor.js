'use strict';

module.exports = (_, model, state) =>

_.div({class: 'resource-editor resource-editor--media-editor'},
    _.include(require('./inc/header')),
    _.div({class: 'resource-editor__body', name: 'body'},
        state.name === 'error' ? [
            _.div({class: 'widget widget--message centered warn'},
                state.message
            )
        
        ] : state.tab === 'overview' ? [
            _.div({class: 'resource-editor__welcome'},
                _.h1('Media'),
                _.p('Click any item in the panel to view it.'),
                _.p('Use the context menu (right click or the ', _.span({class: 'fa fa-ellipsis-v'}), ' button) to perform other actions.'),
                _.div({class: 'widget-group'},
                    _.button({class: 'widget widget--button', onclick: _.onClickNew, title: 'Upload new media'}, 'Upload media'),
                    _.button({class: 'widget widget--button', onclick: _.onClickStartTour, title: 'Start a tour of the UI'}, 'Quick tour')
                )
            )

        ] : state.tab === 'settings' ? [
            _.field({ label: 'Media deployer', description: 'How to read/write media files' },
                state.deployerEditor
            )

        ] : [
            _.div({class: 'resource-editor__body', name: 'body'},
                _.field({label: 'Full'},
                    _.media({nocache: true, readonly: true, value: model.id, full: true}),
                    _.file({class: 'margin-top', filenames: [ model.filename ], onchange: _.onChangeFull})
                ),
                !model.isSvg() ? [
                    _.field({label: 'Thumbnail'},
                        _.partial('thumbnail', (_, model, state) =>
                            _.img({class: 'widget widget--image', src: state.thumbnailSource})
                        ),
                        _.file({accept: '.jpg,.jpeg,.JPG,.JPEG', clearable: true, filenames: [ 'thumbnail.jpg' ], onchange: _.onChangeThumbnail})
                    )
                ] : null,
                _.field({label: 'Folder', tools: { move: { icon: 'folder', tooltip: 'Move', handler: _.onClickMove } }},
                    _.text({value: model.folder, onchange: _.onChangeFolder})
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
                )
            ),
        ]
    ),
    _.include(require('./inc/footer'))
)
