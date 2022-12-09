## Introduction
[Visualisers](https://github.com/webgme/webgme/wiki/GME-Visualizers) are UI components that typically define the visualization in the 
main canvas. Whereas decorators are part of the context or territory of another widget, visualizers control the territories, i.e., which 
nodes are of interest. To handle this it relies on the Client API.
Although free to register for changes in an arbitrary territory, the widget is typically bound to the active object (`client.getActiveObject()`) and
sometimes the selection (`client.getActiveSelection()`). For instance in the ModelEditor, the active object is the node that defines the canvas and the highlighted children is the
active selection.

#### Detailed steps
we can create the visualizer template code using:
 ```
 webgme new viz visualizerName
 ```
1. Get the available **States** and **Transitions** in the model at start. Notify user about model changes.
2. Build the d3 graph based on the given model.
3. Add input field with submit and make mock function to present result to user.
4. Read the `simulator` attribute of the **StateMachine** and embed the blob-url in an `iframe`.
6. Add input field and hook up events from user to the simulator.


### Visualizing the data in the widget
First we will modify the template by keeping a reference to the header element. This we will use as the indicator when there were
changes detected in the underlying gme model. At the start, it will not have any text defined; we will add text if we get any events after the initial load.

When we get the state machine data and know we will be updated if there are changes, we proceed with building up the graph.
The first thing we add is a d3 svg container at initialize and make sure to set the `width` and `height` correctly (and maintain it
on resize).
