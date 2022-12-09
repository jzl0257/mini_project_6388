define([
  "js/Constants",
  "js/Utils/GMEConcepts",
  "js/NodePropertyNames",
  "./Util",
], function (CONSTANTS, GMEConcepts, nodePropertyNames) {
  "use strict";
  function petriVizControl(options) {
    this._logger = options.logger.fork("Control");

    this._client = options.client;

    // Initialize core collections and variables
    this._widget = options.widget;

    this._widget._client = options.client;

    this._currentNodeId = null;
    this.runEvent = null;

    this._rootLoad = false;
    this.setEvent = this.setEvent.bind(this);
    this._initWidgetEventHandlers();

    this._logger.debug("ctor finished");
  }

  petriVizControl.prototype._initWidgetEventHandlers = function () {
    this._widget.onNodeClick = function (id) {
      // Change the current active object
      WebGMEGlobal.State.registerActiveObject(id);
    };
  };

  petriVizControl.prototype.selectedObjectChanged = function (nodeId) {
    var self = this;

    self._logger.debug('activeObject nodeId \'' + nodeId + '\'');

    // Remove current territory patterns
    if (self._currentNodeId) {
      self._client.removeUI(self._territoryId);
      self._rootLoad = false; //addme
    }

    self._currentNodeId = nodeId;

    if (typeof self._currentNodeId === "string") {
      self._selfPatterns = {};
      self._selfPatterns[nodeId] = { children: 1 };

      self._territoryId = self._client.addUI(self, function (events) {
        self._eventCallback(events);
      });

      // Update the territory
      self._client.updateTerritory(self._territoryId, self._selfPatterns);
    }
  };

  // This next function retrieves the relevant node information for the widget
    petriVizControl.prototype._getObjectDescriptor = function (nodeId) {
        var node = this._client.getNode(nodeId),
            objDescriptor;
        if (node) {
            objDescriptor = {
                id: node.getId(),
                name: node.getAttribute(nodePropertyNames.Attributes.name),
                childrenIds: node.getChildrenIds(),
                parentId: node.getParentId(),
                isConnection: GMEConcepts.isConnection(nodeId)
            };
        }

        return objDescriptor;
    };

  /* * * * * * * * Node Event Handling * * * * * * * */
  petriVizControl.prototype._eventCallback = function (events) {
    const self = this;
    var i = events ? events.length : 0,
            event;
    this._logger.debug('_eventCallback \'' + i + '\' items');

    while (i--) {
            event = events[i];
            if(event.eid && event.eid === self._currentNodeId) {
              switch (event.etype) {

                case "load":
                  self._rootLoad = true;
                  break;
                case "update":
                  self._rootLoad = true;
                  break;
                default:
                  self.clearPetriNet()
                  break;
              }
            }
        }

    if (
      events.length && events[0].etype === "complete" && self._rootLoad
    ) {
      self._initNetwork();
    }
  };

  petriVizControl.prototype._stateActiveObjectChanged = function (model, activeObjectId)
  {
    if (this._currentNodeId === activeObjectId) {
      // The same node selected as before - do not trigger
    } else {
      this.selectedObjectChanged(activeObjectId);
    }
  };

  /* * * * * * * * Machine manipulation functions * * * * * * * */
  petriVizControl.prototype._initNetwork = function () {
    const rawMETA = this._client.getAllMetaNodes();
    const META = {};
    const self = this;
    rawMETA.forEach((node) => {
      META[node.getAttribute("name")] = node.getId();
    });
    const petriNetNode = this._client.getNode(this._currentNodeId);
    const elementIds = petriNetNode.getChildrenIds();
    let placeIds = getPlacesIds(this._client, elementIds);
    let transitionIds = getTransitionsIds(this._client, elementIds);
    let Arc_T_to_P = getArcs(
      self._client,
      "Arc_T_to_P",
      elementIds
    );
    let Arc_P_to_T = getArcs(
      self._client,
      "Arc_P_to_T",
      elementIds
    );
    let elementInput = getInputEle(
      placeIds,
      transitionIds,
      Arc_T_to_P
    );
    let startingPlaceId = getSrcID(elementInput);
    let eleOutput = getOutputEle(
      placeIds,
      transitionIds,
      Arc_P_to_T
    );
    let petriNet = {
      deadlockActive: _petriNetInDeadlock,
      startingPlace: startingPlaceId,
      places: {},
      transitions: {},
      elementInput: elementInput,
      eleOutput: eleOutput,
      Arc_P_to_T: Arc_P_to_T,
      Arc_T_to_P: Arc_T_to_P,
    };
    elementIds.forEach((elementId) => {
      const node = self._client.getNode(elementId);
      if (node.isTypeOf(META["Place"])) {
        petriNet.places[elementId] = {
          id: elementId,
          name: node.getAttribute("name"),
          token_num: parseInt(node.getAttribute("token_num")),
          nextPlaceIds: getNextPlace(
            elementId,
            Arc_P_to_T,
            Arc_T_to_P
          ),
          outTransitions: getOutTransitionsFromPlace(elementId, eleOutput),
          inTransitions: getInTransitionsToPlace(elementId, elementInput),
          outArcs: getOutArcsFromPlace(elementId, Arc_P_to_T),
          position: node.getRegistry("position"),
        };
      } else if (node.isTypeOf(META["Transition"])) {
        petriNet.transitions[elementId] = {
          id: elementId,
          name: node.getAttribute("name"),
          outPlaces: getOutPlacesFromTransition(elementId, elementInput),
          inPlaces: getInPlacesToTransition(elementId, eleOutput),
          outArcs: getOutArcsFromTransition(elementId, Arc_T_to_P),
          position: node.getRegistry("position"),
        };
      }
    });
    petriNet.setEvent = this.setEvent;
    self._widget.initMachine(petriNet);
  };

  petriVizControl.prototype.clearPetriNet = function () {
    this._rootLoad = false;
    this._widget.destroyMachine();
  };

  petriVizControl.prototype.setEvent = function (enabledTransitions) {
    this.runEvent = enabledTransitions;
    if (enabledTransitions && enabledTransitions.length >= 1) {
      this.$btnEventButton.clear();
      enabledTransitions.forEach((transition) => {
        this.$btnEventButton.addButton({
          text: `Run inplace ${transition.id}`,
          title: `Run outplace ${transition.name}`,
          data: { event: transition },
          clickFn: (data) => {
            this._widget.runEvent(data.event);
          },
        });
      });
      this.$btnEventButton.addButton({
          text:'Run All',
          title:'Run All',
          data: {event:'FIRE'},
          clickFn: () => {
            this._widget.runEvent()
          },
      })
    } else if (enabledTransitions && enabledTransitions.length === 0) {
      this.runEvent = null;

    }
    this._displayToolbarItems();
  };

  petriVizControl.prototype.runOne = function (enabledTransitions) {
    this.runEvent = enabledTransitions;
    if (enabledTransitions && enabledTransitions.length >= 1) {
      this.$btnRunoneButton.clear();
      enabledTransitions.forEach((transition) => {
        this.$btnRunoneButton.addButton({
          text: `Run inplace ${transition.name}`,
          title: `Run outplace ${transition.name}`,
          data: { event: transition },
          clickFn: (data) => {
            this._widget.runEvent(data.event);
          },
        });
      });
    } else if (enabledTransitions && enabledTransitions.length === 0) {
      this.runEvent = null;
      this.$btnRunoneButton.hide()
    }
    this._displayToolbarItems();
  };

  /* * * * * * * * Visualizer life cycle callbacks * * * * * * * */
  petriVizControl.prototype.destroy = function () {
    this._detachClientEventListeners();
    this._removeToolbarItems();
  };

  petriVizControl.prototype._attachClientEventListeners = function () {
    this._detachClientEventListeners();
    WebGMEGlobal.State.on("change:" + CONSTANTS.STATE_ACTIVE_OBJECT, this._stateActiveObjectChanged,
      this
    );
  };

  petriVizControl.prototype._detachClientEventListeners = function () {
    WebGMEGlobal.State.off("change:" + CONSTANTS.STATE_ACTIVE_OBJECT, this._stateActiveObjectChanged
    );
  };

  petriVizControl.prototype.onActivate = function () {
    this._attachClientEventListeners();
    this._displayToolbarItems();

    if (typeof this._currentNodeId === "string") {
      WebGMEGlobal.State.registerActiveObject(this._currentNodeId, {
        suppressVisualizerFromNode: true,
      });
    }
  };

  petriVizControl.prototype.onDeactivate = function () {
    this._detachClientEventListeners();
    this._hideToolbarItems();
  };

  /* * * * * * * * * * Updating the toolbar * * * * * * * * * */
  petriVizControl.prototype._displayToolbarItems = function () {
    if (this._toolbarInitialized === true) {
      if (this.runEvent === null || this.runEvent.length === 0) {
        this.$deadlockLabel.show();
        this.$btnResetButton.show();
      } else {
        this.$btnEventButton.show();
        this.$btnResetButton.show();
        this.$deadlockLabel.hide();
      }
    } else {
      this._initializeToolbar();
    }
  };

  petriVizControl.prototype._hideToolbarItems = function () {
    if (this._toolbarInitialized === true) {
      for (var i = this._toolbarItems.length; i--;) {
        this._toolbarItems[i].hide();
      }
    }
  };

  petriVizControl.prototype._removeToolbarItems = function () {
    if (this._toolbarInitialized === true) {
      for (var i = this._toolbarItems.length; i--; ) {
        this._toolbarItems[i].destroy();
      }
    }
  };

  petriVizControl.prototype._initializeToolbar = function () {
    var toolBar = WebGMEGlobal.Toolbar;
    const self = this;
    self._toolbarItems = [];
    self._toolbarItems.push(toolBar.addSeparator());


    self.$btnEventButton = toolBar.addDropDownButton({
      text: "Run",
      title: "Run",
    });
    self._toolbarItems.push(self.$btnEventButton);
    self.$btnEventButton.hide();


    self.$btnResetButton = toolBar.addButton({
      title: "Reset",
      text: "Reset",
      clickFn: function () {
        self._widget.resetMachine();
      },
    });
    self._toolbarItems.push(self.$btnResetButton);

    self.$btnPetriNetClassifier = toolBar.addButton({
      text: "Classify",
      clickFn: function () {
        self._client.runServerPlugin
        console.log("State Machine");
      },
    });
    self._toolbarItems.push(self.$btnPetriNetClassifier);


    self.$deadlockLabel = toolBar.addLabel();
    self.$deadlockLabel.text("DEADLOCK");
    self._toolbarItems.push(self.$deadlockLabel);
    self.$deadlockLabel.hide();
    self._toolbarInitialized = true;
  };

  return petriVizControl;
});
