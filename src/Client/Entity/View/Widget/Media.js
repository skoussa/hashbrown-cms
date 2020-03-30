'use strict';

/**
 * A media preview and selector
 *
 * @memberof HashBrown.Client.Entity.View.Widget
 */
class Media extends HashBrown.Entity.View.Widget.WidgetBase {
    /**
     * Constructor
     */
    constructor(params) {
        super(params);

        this.template = require('template/widget/media');
    }

    /**
     * Fetches view data
     */
    async fetch() {
        this.state = {
            source: '',
            title: '',
            tagName: 'div'
        };

        if(this.model.value) {
            let media = this.model.value;

            if(typeof media === 'string') {
                media = await HashBrown.Entity.Resource.Media.get(media);
            }

            if(!media) {
                this.setErrorState(new Error('Not found'));
                
            } else {
                this.state.source = `/media/${HashBrown.Context.project.id}/${HashBrown.Context.environment}/${media.id}?t=${Date.now()}` 

                if(!this.model.full || this.model.thumbnail) {
                    this.state.source += '&thumbnail';
                }
                
                if(this.model.thumbnail) {
                    this.state.tagName = 'img';

                } else {
                    if(media.isImage()) {
                        this.state.tagName = 'img';
                    } else if(media.isVideo()) {
                        this.state.tagName = 'video';
                    }
                }

                this.state.title = media.filename;
            }
        }
    }
    
    /**
     * Gets the placeholder element
     *
     * @return {HTMLElement} Placeholder
     */
    getPlaceholder(_, model, state) {
        return _.div({class: 'widget--media__placeholder'});
    }

    /**
     * Event: Click clear
     */
    onClickClear() {
        this.model.value = null;

        this.update();
    }

    /**
     * Event: Click browse
     */
    onClickBrowse() {
        HashBrown.Entity.View.Modal.MediaBrowser.new({
            model: {
                value: this.model.value
            }
        })
        .on('pick', (id) => {
            this.model.value = id;

            this.onChange();

            this.update();
        });
    }
}

module.exports = Media;
