/*********** UTILITY FUNCTIONS *************/
let getMetaName = (client, node) => {
  let metaTypeId = node.getMetaTypeId();
  return client.getNode(metaTypeId).getAttribute("name");
};

let getArcs = (client, metaName, elementIds) => {
  // metaName = 'Arc_P_to_T' or 'Arc_T_to_P'
  let arcs = [];
  elementIds.forEach((id, i) => {
    let node = client.getNode(id);
    if (getMetaName(client, node) === metaName) {
      arcs.push({
        id: id,
        name: node.getAttribute("name"),
        src: getArcPointerNodeId(node, "src"),
        dst: getArcPointerNodeId(node, "dst"),
      });
    }
  });
  return arcs;
};

let _petriNetInDeadlock = (petriNet) => {
  return Object.keys(petriNet.transitions).every((transId) => {
    getInPlacesToTransition(transId, petriNet.outputVal).every(
      (inPlaceId) => {
        parseInt(petriNet.places[inPlaceId].token_num) <= 0;
      }
    );
  });
};

let getPlacesIds = (client, elementIds) => {
  // get the ids of places from the children
  let places = [];
  elementIds.forEach((id, i) => {
    let node = client.getNode(id);
    if (getMetaName(client, node) === "Place") {
      places.push(id);
    }
  });
  return places;
};

let getTransitionsIds = (client, elementIds) => {
  // get the ids of transitions from the children
  let transitions = [];
  elementIds.forEach((id, i) => {
    let node = client.getNode(id);
    if (getMetaName(client, node) === "Transition") {
      transitions.push(id);
    }
  });
  return transitions;
};

let getOutputEle = (placeIds, transitionIds, Arc_P_to_T) => {
  let outputVal = {};
  placeIds.forEach((place_id, i) => {
    outputVal[place_id] = {};
    transitionIds.forEach((transition_id, j) => {
      outputVal[place_id][transition_id] = getOutFlowFromPlaceToTransition(
        place_id,
        transition_id,
        Arc_P_to_T
      );
    });
  });
  return outputVal;
};

let getInputEle = (placeIds, transitionIds, Arc_T_to_P) => {
  let inputVal = {};
  placeIds.forEach((place_id) => {
    inputVal[place_id] = {};
    transitionIds.forEach((transition_id) => {
      inputVal[place_id][transition_id] = getInFlowToPlaceFromTransition(
        place_id,
        transition_id,
        Arc_T_to_P
      );
    });
  });
  return inputVal;
};

let getArcPointerNodeId = (arc, pointerName) => {
  return arc.getPointerId(pointerName);
};
let getOutFlowFromPlaceToTransition = (placeId, transitionId, Arc_P_to_T) => {
  return Arc_P_to_T.some((arc) => {
    return arc.src === placeId && arc.dst === transitionId;
  });
};
let getInFlowToPlaceFromTransition = (placeId, transitionId, Arc_T_to_P) => {
  return Arc_T_to_P.some((arc) => {
    return arc.src === transitionId && arc.dst === placeId;
  });
};
let placeHasNoFlow = (matrix, placeId) => {
  return Object.entries(matrix[placeId]).every((arr) => {
    return !arr[1];
  });
};

let getSrcID = (inputVal) => {
  for (const placeId in inputVal) {
    if (placeHasNoFlow(inputVal, placeId)) {
      return placeId;
    }
  }
  for (const placeId in inputVal) {
    return placeId;
  }
};

let getNextPlace = (
  placeId,
  Arc_P_to_T,
  Arc_T_to_P
) => {
  let nextPlaces = [];
  let outFlowArcs = Arc_P_to_T.filter((arc) => arc.src === placeId);
  outFlowArcs.forEach((arc_p2t) => {
    nextPlaces.push(
      ...Arc_T_to_P
        .filter((arc_t2p) => arc_t2p.src === arc_p2t.dst)
        .map((arc_t2p) => {
          if (arc_t2p.src === arc_p2t.dst) {
            return arc_t2p.dst;
          }
        })
    );
  });
  return nextPlaces;
};

let getOutTransitionsFromPlace = (placeId, outputVal) => {
  return Object.keys(outputVal[placeId]).filter(
    (transId) => outputVal[placeId][transId]
  );
};
let getInTransitionsToPlace = (placeId, inputVal) => {
  return Object.keys(inputVal[placeId]).filter(
    (transId) => inputVal[placeId][transId]
  );
};
let getInPlacesToTransition = (transId, outputVal) => {
  return Object.keys(outputVal).filter(
    (placeId) => outputVal[placeId][transId]
  );
};
let getOutPlacesFromTransition = (transId, inputVal) => {
  return Object.keys(inputVal).filter(
    (placeId) => inputVal[placeId][transId]
  );
};

let getOutArcsFromPlace = (placeId, Arc_P_to_T) => {
  return Arc_P_to_T.filter((arc) => arc.src === placeId);
};
let getOutArcsFromTransition = (transitionId, Arc_T_to_P) => {
  return Arc_T_to_P.filter((arc) => arc.src === transitionId);
};
