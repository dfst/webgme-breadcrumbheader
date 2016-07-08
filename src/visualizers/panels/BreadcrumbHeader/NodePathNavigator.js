define([
    'js/Constants',
    'css!./styles/node-navigator.css'
], function(
    CONSTANTS
) {

    var RULES = {
            CONTAINMENT: 'containment',
            HISTORY: 'history'
        },
        DEFAULT_CONFIG = {
            style: 'simple',
            pathRule: RULES.CONTAINMENT,
            rootId: CONSTANTS.PROJECT_ROOT_ID
        },
        STYLES = {
            arrows: 'panels/BreadcrumbHeader/styles/arrows.css'
        };

    var ProjectNavWithActiveNode = function (options) {
        this.$el = options.container;
        this.client = options.client;
        this.logger = options.logger.fork('NodePath');

        // Load the config
        this.config = _.extend({}, DEFAULT_CONFIG,
            WebGMEGlobal.componentSettings[this.getComponentId()]);

        // Validate the pathRule
        var rules = Object.keys(RULES).map(rule => RULES[rule]);
        if (rules.indexOf(this.config.pathRule) === -1) {
            this.logger.warn(`unknown path rule "${this.config.pathRule}". Falling back to "containment"`);
            this.config.pathRule = RULES.CONTAINMENT;
        }

        this.territories = {};
        this.territoryId = null;
        this._nodes = {};
        this._nodeHistory = [CONSTANTS.PROJECT_ROOT_ID];
        this.initialize();
    };

    ProjectNavWithActiveNode.prototype.initialize = function() {
        var breadcrumbContainer = document.createElement('ol');

        breadcrumbContainer.setAttribute('style', 'height:100%');
        this.pathContainer = $(breadcrumbContainer);
        this.$el.append(breadcrumbContainer);

        // Set the activeNode
        WebGMEGlobal.State.on('change:' + CONSTANTS.STATE_ACTIVE_OBJECT,
            this.updatePath, this);

        // Load the css
        if (this.config.style !== DEFAULT_CONFIG.style) {
            // load the style or assume requirejs path
            var cssPath = STYLES[this.config.style] || this.config.style;

            require(['css!' + cssPath], function() {
                breadcrumbContainer.setAttribute('class', 'breadcrumb-nodes');
            }, function(err) {
                this.logger.warn('Could not load css at ' + cssPath + ': ' + err);
                breadcrumbContainer.setAttribute('class', 'breadcrumb');
            });
        } else {
            breadcrumbContainer.setAttribute('class', 'breadcrumb');
        }
    };

    ProjectNavWithActiveNode.prototype.getComponentId = function() {
        return 'BreadcrumbHeader';
    };

    ProjectNavWithActiveNode.prototype.clear = function() {
        this.pathContainer.empty();
        if (this.territoryId) {
            this.client.removeUI(this.territoryId);
        }
        this._nodes = {};
        // If the pathRule is 'history', keep the territories
        if (this.config.pathRule === RULES.CONTAINMENT) {
            this.territories = {};
        }
    };

    ProjectNavWithActiveNode.prototype.updatePath = function(model, nodeId) {
        var node = this.client.getNode(nodeId),
            prevId,
            nodes = [];

        if (!node) {
            return;
        }

        // Clear the bar
        this.clear();

        // Populate the bar with the nodes from the root to the active node
        nodes = this.getNodePath(nodeId);
        for (var i = 0; i < nodes.length; i++) {
            this.addNode(nodes[i]);
        }

        // update the territory
        this.territoryId = this.client.addUI(this, this.eventHandler.bind(this));
        this.client.updateTerritory(this.territoryId, this.territories);
    };

    ProjectNavWithActiveNode.prototype.getNodePath = function(nodeId) {
        var node = this.client.getNode(nodeId),
            nodes = [],
            prevId;

        if (this.config.pathRule === RULES.CONTAINMENT) {
            while (node && (prevId !== this.config.rootId)) {
                nodes.unshift(node);

                // Get the next
                prevId = nodeId;
                nodeId = node.getParentId();
                node = this.client.getNode(nodeId);
            }
            return nodes;
        } else {  // history
            // Check for the given nodeId
            // What if the user reloads the page? We should infer the path to get there...
            // TODO
            var i = this._nodeHistory.indexOf(nodeId),
                len = this._nodeHistory.length,
                old;

            if (i > -1) {
                old = this._nodeHistory.splice(i, len-i);
                old.forEach(id => delete this.territories[id]);
            }

            this._nodeHistory.push(nodeId);
            return this._nodeHistory.map(id => this.client.getNode(id));
        }
    };

    ProjectNavWithActiveNode.prototype.eventHandler = function(events) {
        for (var i = events.length; i--;) {
            if (events[i].etype === CONSTANTS.TERRITORY_EVENT_UPDATE) {
                this.updateNode(events[i].eid);
            }
        }
    };

    ProjectNavWithActiveNode.prototype.updateNode = function(id) {
        var node = this.client.getNode(id),
            name = node.getAttribute('name');

        this._nodes[id].innerHTML = name;
    };

    ProjectNavWithActiveNode.prototype.addNode = function(node, isActive) {
        // Set the territory for the node (in case of rename)
        var item = document.createElement('li'),
            anchor = document.createElement('a'),
            id = node.getId();

        if (isActive) {
            item.setAttribute('class', 'active');
            item.innerHTML = node.getAttribute('name');
            this._nodes[id] = item;
        } else {
            anchor.innerHTML = node.getAttribute('name');
            this._nodes[id] = anchor;
            item.appendChild(anchor);
            item.addEventListener('click', 
                WebGMEGlobal.State.registerActiveObject.bind(WebGMEGlobal.State, id));
        }

        this.territories[id] = {children: 0};
        this.pathContainer.append(item);
    };

    return ProjectNavWithActiveNode;
});
