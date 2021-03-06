'use strict';

/**
 * The editor for schema resources
 */
class SchemaEditor extends HashBrown.Entity.View.ResourceEditor.ResourceEditorBase {
    static get category() { return 'schemas'; }
    static get itemType() { return HashBrown.Entity.Resource.Schema.SchemaBase; }
    
    /**
     * Constructor
     */
    constructor(params) {
        super(params);
        
        this.template = require('template/resourceEditor/schemaEditor.js');
    }

    /**
     * Fetches the model
     */
    async fetch() {
        if(this.state.id) {
            this.model = await HashBrown.Service.SchemaService.getSchemaById(this.state.id);
            this.state.compiledSchema = await HashBrown.Service.SchemaService.getSchemaById(this.model.id, true);
            
            let allContentSchemas = await HashBrown.Service.SchemaService.getAllSchemas('content');
            let allFieldSchemas = await HashBrown.Service.SchemaService.getAllSchemas('field');

            this.state.childSchemaOptions = {};

            for(let schema of allContentSchemas) {
                this.state.childSchemaOptions[schema.name] = schema.id;
            }
            
            this.state.parentSchemaOptions = {};

            for(let schema of this.model.type === 'field' ? allFieldSchemas : allContentSchemas) {
                if(schema.id === this.model.id) { continue; }
                
                this.state.parentSchemaOptions[schema.name] = schema.id;
            }
        }    
    }

    /**
     * Pre render
     */
    prerender() {
        if(this.state.name) { return; }

        this.state.title = this.model.name;
        this.state.icon = this.model.icon || this.state.compiledSchema.icon;
        
        if(this.model instanceof HashBrown.Entity.Resource.Schema.ContentSchema) {
            this.state.tab = this.state.tab || 'content';
            this.state.properties = {};
            this.state.parentTabs = {};
            this.state.tabOptions = {};

            // Build parent tabs and tab options
            for(let tabId in this.state.compiledSchema.tabs) {
                this.state.tabOptions[this.state.compiledSchema.tabs[tabId]] = tabId;

                if(this.model.tabs[tabId]) { continue; }

                this.state.parentTabs[tabId] = this.state.compiledSchema.tabs[tabId];
            }
            
            for(let tabId in this.model.tabs) {
                this.state.tabOptions[this.model.tabs[tabId]] = tabId;
            }

            if(!this.model.fields || !this.model.fields.properties) { return; }

            for(let key in this.model.fields.properties) {
                let definition = this.model.fields.properties[key];

                if(!definition.tabId) { definition.tabId = 'content'; }

                if(definition.tabId !== this.state.tab) { continue; }

                this.state.properties[key] = definition.label;
            }
        
        } else if(this.model instanceof HashBrown.Entity.Resource.Schema.FieldSchema) {
            this.state.fieldConfigEditor = null;
            
            let fieldType = HashBrown.Entity.View.Field[this.model.editorId];
           
            if(fieldType) {
                this.state.fieldConfigEditor = new fieldType({
                    model: this.model,
                    state: {
                        name: 'config',
                        hideKey: true,
                        hideTools: true
                    }
                });

                this.state.fieldConfigEditor.on('change', (newValue) => {
                    this.model.config = newValue;

                    this.onChange();
                });
            }
        }
    }

    /**
     * Event: Change id
     */
    onChangeId(id) {
        this.model.id = id;
    
        this.onChange();
    }
    
    /**
     * Event: Change name
     */
    onChangeName(name) {
        this.model.name = name;

        this.onChange();
    }
    
    /**
     * Event: Click change icon
     */
    onClickChangeIcon() {
        let modal = new HashBrown.Entity.View.Modal.PickIcon();

        modal.on('change', (newIcon) => {
            this.model.icon = newIcon;

            this.onChange();
            this.render();
        });
    }
    
    /**
     * Event: Click edit field
     *
     * @param {String} key
     */
    onClickEditField(key) {
        if(!this.model.fields) { this.model.fields = {}; }
        if(!this.model.fields.properties) { this.model.fields.properties = {}; }
        if(!this.model.fields.properties[key]) { this.model.fields.properties[key] = { tabId: this.state.tab, schemaId: 'string' }; }

        let modal = new HashBrown.Entity.View.Modal.EditField({
            model: {
                tabOptions: this.state.tabOptions,
                key: key,
                definition: this.model.fields.properties[key]
            }
        });
        
        modal.on('changekey', (newKey) => {
            this.onChangeFieldKey(key, newKey);

            key = newKey;

            this.render();
        });

        modal.on('change', (newValue) => {
            this.onChangeFieldDefinition(key, newValue);
            
            this.render();
        });
    }
    
    /**
     * Event: Click start tour
     */
    onClickStartTour() {
        HashBrown.Service.SchemaService.startTour();
    }

    /**
     * Event: Change field key
     */
    onChangeFieldKey(oldKey, newKey) {
        let keys = Object.keys(this.model.fields.properties);

        let newFields = {};

        for(let key of keys) {
            let value = this.model.fields.properties[key];

            if(key === oldKey) { key = newKey; }

            newFields[key] = value;
        }

        this.model.fields.properties = newFields;

        this.onChange();
    }

    /**
     * Event: Change field definition
     */
    onChangeFieldDefinition(key, newValue) {
        if(!this.model.fields) { this.model.fields = {}; }
        if(!this.model.fields.properties) { this.model.fields.properties = {}; }
        if(!this.model.fields.properties[key]) { this.model.fields.properties[key] = { schemaId: 'string' }; }
       
        this.model.fields.properties[key] = newValue;

        this.onChange();
    }

    /**
     * Event: Change field sorting
     */
    onChangeFieldSorting(fields) {
        let newFields = {};

        // Add fields from list widget
        for(let key in fields) {
            let definition = this.model.fields.properties[key];

            newFields[key] = definition || { tabId: this.state.tab, label: fields[key] };
        }
        
        // Add back remaining fields not in the current view
        for(let key in this.model.fields.properties) {
            let definition = this.model.fields.properties[key];

            if(definition.tabId === this.state.tab) { continue; }

            newFields[key] = definition;
        }
        
        let isNewField = Object.keys(fields).length > Object.keys(this.state.properties).length;

        this.model.fields.properties = newFields;
        
        if(isNewField) {
            this.onClickEditField(Object.keys(fields).pop());
        }
        
        this.onChange();
    }

    /**
     * Event: Change allowed at root
     */
    onChangeAllowedAtRoot(newValue) {
        this.model.allowedAtRoot = newValue;
        
        this.onChange();
    }

    /**
     * Event: Change allowed child schemas
     */
    onChangeAllowedChildSchemas(newValue) {
        this.model.allowedChildSchemas = newValue;
        
        this.onChange();
    }
    
    /**
     * Event: Change parent schema id
     */
    onChangeParentSchemaId(newValue) {
        this.model.parentSchemaId = newValue;

        this.onChange();
    }

    /**
     * Event: Change default tab id
     */
    onChangeDefaultTabId(newValue) {
        this.model.defaultTabId = newValue;
        
        this.onChange();
    }

    /**
     * Event: Change tabs
     */
    onChangeTabs(tabs) {
        this.model.tabs = tabs;

        this.render();

        this.onChange();
    }

    /**
     * Event: Switch tab
     */
    onSwitchTab(tab) {
        this.state.tab = tab;

        this.render();
    }

    /**
     * Event: Click save
     */
    async onClickSave() {
        await HashBrown.Service.SchemaService.setSchemaById(this.state.id, this.model);

        UI.notifySmall(`"${this.state.title}" saved successfully`, null, 3);
        
        this.setDirty(false);

        if(this.state.id !== this.model.id) {
            location.hash = `/schemas/${this.model.id}`;
        }
    }

    /**
     * Event: Click import
     */
    onClickImport() {
        let modal = UI.prompt(
            'Import schemas',
            'URL to uischema.org definitions',
            'text',
            'https://uischema.org/schemas.json',
            async (url) => {
                if(!url) { UI.notify('Missing URL', 'Please specify a URL'); }

                try {
                    await HashBrown.Service.RequestService.request('post', 'schemas/import?url=' + url);

                    HashBrown.Service.EventService.trigger('resource'); 

                    UI.notifySmall('Schemas imported successfully from ' + url, null, 3);

                } catch(e) {
                    UI.error(e);

                }
            }
        );
    }
}

module.exports = SchemaEditor;
