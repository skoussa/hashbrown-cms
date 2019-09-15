'use strict';

module.exports = (_, model, state) =>

_.div({class: 'modal in'},
    _.div({class: 'modal__dialog'},
        _.div({class: 'modal__header'},
            _.h4({class: 'modal__title'}, state.heading),
            _.button({class: 'modal__close fa fa-close', onclick: _.onClickClose})
        ),
        _.div({class: 'modal__body'},
            state.message,
        ),
        _.div({class: 'modal__footer'},
            _.button({class: 'widget widget--button standard', onclick: _.onClickClose}, 'Cancel'),
            _.button({class: 'widget widget--button', onclick: _.onClickOK}, 'OK')
        )
    )
)
