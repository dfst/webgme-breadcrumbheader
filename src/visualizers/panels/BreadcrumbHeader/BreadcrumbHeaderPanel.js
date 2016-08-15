/*globals define, _, WebGMEGlobal*/
/*jshint browser: true*/

define([
    'js/Panels/Header/HeaderPanel',
    'js/PanelBase/PanelBase',
    'js/Toolbar/Toolbar',
    './NodePathNavigator',
    'js/Panels/Header/DefaultToolbar',
    'js/Utils/ComponentSettings'
], function (
    HeaderPanel,
    PanelBase,
    toolbar,
    NodePathNavigator,
    DefaultToolbar,
    ComponentSettings
) {
    'use strict';

    var BreadcrumbHeaderPanel = function (layoutManager, params) {
        var options = {};
        //set properties from options
        options[PanelBase.OPTIONS.LOGGER_INSTANCE_NAME] = 'BreadcrumbHeaderPanel';

        //call parent's constructor
        PanelBase.apply(this, [options]);

        this._config = this.getDefaultConfig();
        ComponentSettings.resolveWithWebGMEGlobal(this._config, this.getComponentId());
        this._client = params.client;

        //initialize UI
        this._initialize();

        this.logger.debug('ctor finished');
    };

    //inherit from PanelBaseWithHeader
    _.extend(BreadcrumbHeaderPanel.prototype, HeaderPanel.prototype);

    BreadcrumbHeaderPanel.prototype._initialize = function () {
        //main container
        HeaderPanel.prototype._initialize.call(this);

        // Node nav bar
        //remove default 'toolbar-container'
        this.$el.find('.toolbar-container').remove();
        var nodePath = new NodePathNavigator({
            container: $('<div/>', {class: 'toolbar-container'}),
            client: this._client,
            logger: this.logger
        });
        this.$el.append(nodePath.$el);
        WebGMEGlobal.Toolbar = toolbar.createToolbar($('<div/>'));
        new DefaultToolbar(this._client);
    };

    BreadcrumbHeaderPanel.prototype.getDefaultConfig = function () {
        return {};
    };

    BreadcrumbHeaderPanel.prototype.getComponentId = function () {
        return 'BreadcrumbHeader';
    };

    return BreadcrumbHeaderPanel;
});
