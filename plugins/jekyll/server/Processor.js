'use strict';

const Yaml = require('./lib/yamljs/Yaml');

class JekyllProcessor extends HashBrown.Models.Processor {
    // Name and alias
    static get name() { return 'Jekyll'; }
    static get alias() { return 'jekyll'; }
    
    /**
     * Compiles content for Jekyll
     *
     * @param {Content} content
     * @param {String} language
     *
     * @returns {Promise} Result
     */
    process(
        content = requiredParam('content'),
        language = requiredParam('language')
    ) {
        let properties = content.getLocalizedProperties(language);

        if(!properties) {
            return Promise.reject(new Error('No properties for content "' + content.id + '" with language "' + language + '"'));
        }

        debug.log('Processing "' + properties.title + '" for Jekyll...', this);

        let frontMatter = '';

        frontMatter += '---\n';
        frontMatter += Yaml.stringify(properties, 50); 
        frontMatter += '---';

        return Promise.resolve({
            data: frontMatter,
            filename: content.id + '.md'
        });
    }
}

module.exports = JekyllProcessor;
