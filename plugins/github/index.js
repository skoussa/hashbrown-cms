'use strict';

let octokat = require('octokat');
let env = require('../../env.json');

class GitHub {
    /**
     * Constructor
     * Registers all hooks
     */
    constructor(controller) {
        // Git operations
        controller.hook('post', '/api/git/repos', this.repos);
        controller.hook('post', '/api/git/compare/:user/:repo/:base/:head', this.compare);
        controller.hook('post', '/api/git/repos/:user', this.repos);
        controller.hook('post', '/api/git/refs/:mode/:user/:repo/:branch', this.refs);
        controller.hook('post', '/api/git/tree/:mode/:user/:repo/:branch', this.tree);
        controller.hook('post', '/api/git/file/:mode/:user/:repo/*', this.file);
        controller.hook('post', '/api/git/repo/:user/:repo', this.repo);
        controller.hook('post', '/api/git/branches/:user/:repo', this.branches);
        controller.hook('post', '/api/git/merge/:user/:repo', this.merge);

        // Auth operations
        controller.hook('post', '/api/login', this.login);

        // Organisation operations
        controller.hook('post', '/api/orgs', this.orgs);
        controller.hook('post', '/api/collaborators/:mode/:user/:repo', this.collaborators);

        // Issue tracking operations
        controller.hook('post', '/api/issue-tracking/issues/:mode/:user/:repo', this.issues);
        controller.hook('post', '/api/issue-tracking/labels/:mode/:user/:repo', this.labels);
        controller.hook('post', '/api/issue-tracking/milestones/:mode/:user/:repo', this.milestones);

        // Abstract CMS operations
        controller.hook('post', '/api/content/publish/:user/:repo/:branch/*', this.publish);
        controller.hook('post', '/api/structs/pages/:mode/:user/:repo/:struct*', this.pageStruct);
        controller.hook('post', '/api/structs/fields/:mode/:user/:repo', this.fieldStruct);

        // Redirects
        controller.hook('get', '/redir/repo/:user/:repo/:branch', this.redir);
    }
    
    /**
     * API call
     * A generic abstract API call for handling most cases
     */
    static apiCall(req, res, url, customCallback) {
        function callback(err, answer) {
            if(err) {
                res.send({ mode: req.params.mode, url: url, err: err, data: req.body });
            } else {
                if(customCallback) {
                    customCallback(answer);

                } else {
                    res.send(answer);
                }
            }
        }
        
        let octo = new octokat({ token: req.body.token });
        
        delete req.body.token;

        switch(req.params.mode) {
            case 'create':
                octo.fromUrl(url).create(req.body, callback);
                break;
            
            case 'update':
                octo.fromUrl(url).update(req.body, callback);
                break;
            
            case 'fetch': default:
                octo.fromUrl(url).fetch(req.body, callback);
                break;
        }
    }

    /**
     * Login
     * Handles GitHub credentials viw Basic Auth
     */
    login(req, res) {
        let octo = new octokat({
            username: req.body.username,
            password: req.body.password
        });
        
        octo.authorizations.create(
            {
                scopes: [
                    'repo',
                    'user',
                    'admin:org'        
                ],
                note: 'Putaitu CMS token',
                client_id: env.plugins.github.client.id,
                client_secret: env.plugins.github.client.secret
            },
            function(err, val) {
                if(err) {
                    res.send({ err: err });
                } else {
                    res.send(val);
                }
            }
        );
    }
    
    /**
     * Organisations
     * Gets/sets orginsation info
     */
    orgs(req, res) {
        let octo = new octokat({
            username: req.body.username,
            password: req.body.password
        });

        octo.me.orgs.fetch(function(err, val) {
            if(err) {
                res.send({ err: err });
            } else {
                res.send(val);
            }
        });
    }

    /**
     * Repos
     * Gets repositories for current organisaion
     */
    repos(req, res) {
        let octo = new octokat({ token: req.body.token });

        octo.me.repos.fetch(function(err, val) {
            if(err) {
                res.send({ err: err });
            } else {
                res.send(val);
            }
        });
    }

    /**
     * Compare
     * Compare two branches (base and head)
     */
    compare(req, res) {
        let url = '/repos/' + req.params.user + '/' + req.params.repo + '/compare/' + req.params.base + '...' + req.params.head;

        GitHub.apiCall(req, res, url);
    }

    /**
     * Repos
     * Get repos from user
     */
    repos(req, res) {
        let url = '/users/' + req.params.user + '/repos';

        GitHub.apiCall(req, res, url);
    }
    
    /**
     * Collaborators
     * List all collaborators on a given repository
     */
    collaborators(req, res) {
        let url = '/repos/' + req.params.user + '/' + req.params.repo + '/collaborators';

        GitHub.apiCall(req, res, url);
    }
    
    /**
     * Issues
     * Get/set issues with some needed preprocessing
     */
    issues(req, res) {
        let url = '/repos/' + req.params.user + '/' + req.params.repo + '/issues';
        
        // Updating issues requires a number from the GitHub API
        if(req.params.mode == 'update') {
            url += '/' + req.body.number;
        }

        GitHub.apiCall(req, res, url);
    }
   
    /**
     * Refs
     * Get refs from a given repo
     */ 
    refs(req, res) {
        let url = '/repos/' + req.params.user + '/' + req.params.repo + '/git/refs';

        GitHub.apiCall(req, res, url);
    }
    
    /**
     * Tree
     * Get entire tree recursively from a given repository and branch
     */
    tree(req, res) {
        let refsUrl = '/repos/' + req.params.user + '/' + req.params.repo + '/git/refs';

        GitHub.apiCall(req, res, refsUrl, function(refs) {
            let sha = '';

            for(let ref of refs) {
                if(ref.ref == 'refs/heads/' + req.params.branch) {
                    sha = ref.object.sha;
                }
            }

            let treeUrl = '/repos/' + req.params.user + '/' + req.params.repo + '/git/trees/' + sha + '?recursive=1';

            GitHub.apiCall(req, res, treeUrl);
        });
    }
    
    /**
     * Labels
     * Get/set labels of a given repository
     */
    labels(req, res) {
        let url = '/repos/' + req.params.user + '/' + req.params.repo + '/labels';

        GitHub.apiCall(req, res, url);
    }
    
    /**
     * File
     * Get/set a file of a given repository
     */
    file(req, res) {
        let baseUrl = '/api/git/file/' + req.params.mode + '/' + req.params.user + '/' + req.params.repo + '/';
        let apiUrl = '/repos/' + req.params.user + '/' + req.params.repo + '/contents';
        let path = req.url.replace(baseUrl, '');
        let url = apiUrl + path;

        GitHub.apiCall(req, res, url);
    }
    
    /**
     * Milestones
     * Get/set milestones of a given repository
     */ 
    milestones(req, res) {
        let url = '/repos/' + req.params.user + '/' + req.params.repo + '/milestones';
        
        GitHub.apiCall(req, res, url);
    }
    
    /**
     * Repo
     * Get rpository information
     */
    repo(req, res) {
        let url = '/repos/' + req.params.user + '/' + req.params.repo;
        
        GitHub.apiCall(req, res, url);
    }
    
    /**
     * Branches
     * Get/set branches of a given repository
     */
    branches(req, res) {
        let octo = new octokat({ token: req.body.token });
        let url = '/repos/' + req.params.user + '/' + req.params.repo + '/branches';

        octo.fromUrl(url).fetch(function(err, branches) {
            if(err) {
                res.send({ err: err });
            } else {
                let output = [];

                for(let i = 0; i < branches.length; i++) {
                    let branchUrl = url + '/' + branches[i].name;

                    octo.fromUrl(branchUrl).fetch(function(err, branch) {
                        branch.updated = branch.commit.commit.committer;
                        branch.updated.message = branch.commit.commit.message;

                        output.push(branch);

                        if(output.length == branches.length) {
                            res.send(output);
                        }
                    });
                }
            }
        });
    }
    
    /**
     * Merge
     * Merge two branches of a given repository
     */
    merge(req, res) {
        let url = '/repos/' + req.params.user + '/' + req.params.repo + '/merges';

        GitHub.apiCall(req, res, url);
    }
    
    /**
     * Page struct
     * Get/set page struct
     */
    pageStruct(req, res) {
        let octo = new octokat({ token: req.body.token });

        // Get the default struct
        let page = require('../../structs/page.json');

        octo.fromUrl('/repos/' + req.params.user + '/' + req.params.repo + '/contents/structs/' + req.params.struct + '.json').fetch(function(err, file) {
            let output = page;

            if(!err) {
                console.log(file.content);
            }

            res.send(output);  
        });
    }
    
    /** 
     * Field struct
     * Get/set field structs
     */
    fieldStruct(req, res) {
        // Get the default structs
        let page = require('../../structs/fields.json');

        res.send(page);
    }

    /**
     * Redirect to repo
     */
    redir(req, res) {
        res.redirect('https://github.com/' + req.params.user + '/' + req.params.repo + '/tree/' + req.params.branch);
    }

    /**
     * Publish content
     */
    publish(req, res) {
        let baseUrl = '/api/content/publish/' + req.params.user + '/' + req.params.repo + '/' + req.params.branch + '/';
        let apiUrl = '/repos/' + req.params.user + '/' + req.params.repo + '/contents/';
        let path = req.url;
        
        // Remove the base url to get the file path
        path = path.replace(baseUrl, '');

        // No underscores for published content
        path = path.replace('_', '');
        
        // Use markdown extension
        path = path.replace('.json', '.md');
        
        // If any leftover leading slashes, remove them
        if(path.indexOf('/') == 0) {
            path = path.replace('/', '');
        }   

        let url = apiUrl + path;

        req.params.mode = 'create';

        GitHub.apiCall(req, res, url);
    }
}

module.exports = GitHub;