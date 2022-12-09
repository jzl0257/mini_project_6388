# 6388 Final project
The final project is trying to design a Studio that is working with Petri-Net.

## Petri Network
A Petri net is defined as a triple (P, T, F) where:

● P is a finite set of ​places

● T is a finite set of ​transitions ​(P ∩ T = ∅)

● F ⊆ (P x T) ∪ (T x P) is a set of ​arcs ​(flow relation) {for short we will write f(p→t) to describe an arc that connect transition t to place p}

Additionally, ​marking​ M ∈ P → Z* is a function that assigns a non-negative integer to every place and represents the state of the net (some definitions call this a marked petri net). M(p) denotes the marking of place p. ​Inplaces ​of a transition (*t) is a set of places where each element of a set is connected to the transition (the place is the source of the arc and the transition is the destination). Conversely, ​outplaces ​of a transition (t*) is a set of places that are connected to the transition by ​arcs ​where the places are the destinations and the transition is the source.

The following definitions cover how the petri net progress from one marking to another:

● t∈T is ​enabled ​if∀p∈P |∃f(p→t)∈F M(p) > 0 - for all ​inplaces ​of the transition (that are connected to the transition via an incoming arc) the amount of tokens at the place is non zero

● Firing ​an enabled transition decreases the amount of tokens on all ​inplaces w​ ith one and increases the amount of token in all ​outplaces ​of the transition by one.

# Domain
The domain is a petri net which allow for better views into semantics controls in systems. A Petri net is a directed graph consisting of two kinds of nodes, place and transition, with arcs from a place to a transition or from a transition to a place. Place are shown as circle, and transition as rectangle. A marking assign to each place a string representing tokens. Also, the numbers of inplace and outplace are not NULL.

# Use Case
● Free-choice petri net​ - if the intersection of the inplaces sets of two transitions are not
empty, then the two transitions should be the same (or in short, each transition has its
own unique set if ​inplaces)​

● State machine​ - a petri net is a state machine if every transition has exactly one ​inplace
and one ​outplace​.

● Marked graph​ - a petri net is a marked graph if every place has exactly one out transition
and one in transition.

● Workflow net ​- a petri net is a workflow net if it has exactly one source place s where *s
=∅, one sink place o where o* =∅, and every x∈P∪T is on a path from s to o.

# Installation
This repository is intended to server as a bootstrap for a fully docker based Design Studio development with WebGME.
This way, the developer's computer can remain clean from installation (other than docker and required images) of any additional software.
So, forget the hassle of installing and running mongoDB, or Nodejs+npm, or Python that all can be challenging based on your actual OS.
Just enjoy the pure joy of creating a Design Studio that really boost the productivity of engineers!

## Initialization
The easiest way to start using this project is to fork it in git. Alternatively, you can create your empty repository, copy the content and just rename all instances of 'WDeStuP' to your liking. Assuming you fork, you can start-up following this few simple steps:
- install [Docker-Desktop](https://www.docker.com/products/docker-desktop)
- clone the repository
- edit the '.env' file so that the BASE_DIR variable points to the main repository directory
- `docker-compose up -d`
- connect to your server at http://localhost:8888

## Main docker commands
All of the following commands should be used from your main project directory (where this file also should be):
- To **rebuild** the complete solution `docker-compose build` (and follow with the `docker-compose up -d` to restart the server)
- To **debug** using the logs of the WebGME service `docker-compose logs webgme`
- To **stop** the server just use `docker-compose stop`
- To **enter** the WebGME container and use WebGME commands `docker-compose exec webgme /usr/bin` (you can exit by simply closing the command line with linux command 'exit') 
- To **clean** the host machine of unused (old version) images `docker system prune -f`
## Using WebGME commands to add components to your project
In general, you can use any WebGME commands after you successfully entered the WebGME container. It is important to note that only the src directory is shared between the container and the host machine, so you need to additionally synchronize some files after finishing your changes inside the container! The following is few scenarios that frequently occur:
### Adding new npm dependency
When you need to install a new library you should follow these steps:
- enter the container
- `npm i -s yourNewPackageName`
- exit the container
- copy the package.json file `docker-compose cp webgme:/usr/app/package.json package.json`

__Alternatively, run the 'add_npm_package.bat(sh)' and follow instructions.__
### Adding new interpreter/plugin to your DS
Follow these steps to add a new plugin:
- enter the container
- for JS plugin: `npm run webgme new plugin MyPluginName`
- for Python plugin: `npm run webgme new plugin --language Python MyPluginName`
- exit container
- copy webgme-setup.json `docker-compose cp webgme:/usr/app/webgme-setup.json webgme-setup.json`
- copy webgme-config `docker-compose cp webgme:/usr/app/config/config.webgme.js config/config.webgme.js`

__Alternatively, run the 'create_plugin.bat(sh)' and follow instructions.__
### Adding new visualizer to your DS
Follow these steps to add a new visualizer:
- enter the container
- `npm run webgme new viz MyVisualizerName`
- exit container
- copy webgme-setup.json `docker-compose cp webgme:/usr/app/webgme-setup.json webgme-setup.json`
- copy webgme-config `docker-compose cp webgme:/usr/app/config/config.webgme.js config/config.webgme.js`

__Alternatively, run the 'create_visualizer.bat(sh)' and follow instructions.__
### Adding new seed to your DS
Follow these steps to add a new seed based on an existing project in your server:
- enter the container
- `npm run webgme new seed MyProjectName -n MySeedName`
- exit container
- copy webgme-setup.json `docker-compose cp webgme:/usr/app/webgme-setup.json webgme-setup.json`
- copy webgme-config `docker-compose cp webgme:/usr/app/config/config.webgme.js config/config.webgme.js`

# How to start model
You can design the model in the compositions of VISUALIZER SELECTOR, put the Place and tranisition, set the number of tokens, and then you can see a model constrcted in the petriViz. 
# Functions and features
We can set the number of tokens of each place and in the visualizer, we can click run button, it can run one transition or run all active transitions. If it is deadlock, there is also a button to reset the model. And we can see the number of tokens of each place when we run transitions.



