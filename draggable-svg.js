Nodes = new Meteor.Collection('nodes');
Connectors = new Meteor.Collection('connectors');

if (Meteor.isClient) {

  Session.setDefault('matrix',[1,0,0,1,0,0]);
  Session.setDefault('windowHeight', $(window).height());
  Session.setDefault('windowWidth', $(window).width());

  Session.setDefault('networkNodeHeight', 75);
  Session.setDefault('networkNodeWidth', 25);
  Session.setDefault('boundaryNodeHeight', 50);
  Session.setDefault('boundaryNodeWidth', 150);
  $( window ).resize(function() {
    Session.set('windowHeight', $(window).height());
    Session.set('windowWidth', $(window).width());
  });

  var nodeDrag = d3.behavior.drag().on("drag", function(d) {
    var id = $(this).data("id");
    if(id && d3.event.dx !== 0 || d3.event.dy !== 0){
      var setObject = {};
      if(d3.event.dx !== 0)
         setObject.positionX = d3.event.dx;
      
      if(d3.event.dy !== 0)
        setObject.positionY = d3.event.dy;
      
      if(setObject.positionX || setObject.positionY)
        Nodes.update({_id:id},{$inc:setObject});
    }
  });
  var backgroundDrag = d3.behavior.drag().on("drag", function(d) {
    if(d3.event.dx !== 0 || d3.event.dy !== 0){
      panMatrix(d3.event.dx, d3.event.dy);
    }
  });
  Template.networkNode.rendered = function ( ) {
    d3.select("#networkNode_"+this.data._id).call(nodeDrag);
  };
  Template.boundaryNode.rendered = function ( ) {
    d3.select("#boundaryNode_"+this.data._id).call(nodeDrag);
  };
  Template.board.rendered = function ( ) {
    d3.select("#draggableBackground").call(backgroundDrag);
  };

  Template.board.helpers({
    "networkNodes":function(){
      return Nodes.find({"type":"network"});
    },
    "boundaryNodes":function(){
      return Nodes.find({"type":{$ne:"network"}});
    },
    "connectors":function(){
      return Connectors.find({});
    },
    "matrix":function(){
      return Session.get('matrix').join(' ');
    },
    "windowWidth":function(){
      return Session.get('windowWidth');
    },
    "windowHeight":function(){
      return Session.get('windowHeight');
    }
  });

  Template.networkNode.helpers({
    'networkNodeWidth':function(){
      return Session.get('networkNodeWidth');
    },
    'networkNodeHeight':function(){
      return Session.get('networkNodeHeight');
    }
  });

  Template.boundaryNode.helpers({
    'boundaryNodeWidth':function(){
      return Session.get('boundaryNodeWidth');
    },
    'boundaryNodeHeight':function(){
      return Session.get('boundaryNodeHeight');
    }
  });

  Template.connector.helpers({
    "sourceX":function(){
      var node = Nodes.findOne({_id:this.sourceId});
      if(node){
        var positionX = node.positionX;
        if(node.type !== "network")
          positionX += Session.get('boundaryNodeWidth')/2;
        return positionX;
      }
    },
    "sourceY":function(){
      var node = Nodes.findOne({_id:this.sourceId});
      if(node){
        var positionY = node.positionY;
        if(node.type !== "network")
          positionY += Session.get('boundaryNodeHeight')/2;
        return positionY;
      }
    },
    "targetX":function(){
      var node = Nodes.findOne({_id:this.targetId});
      if(node){
        var positionX = node.positionX;
        if(node.type !== "network")
          positionX += Session.get('boundaryNodeWidth')/2;
        return positionX;
      }
    },
    "targetY":function(){
      var node = Nodes.findOne({_id:this.targetId});
      if(node){
        var positionY = node.positionY;
        if(node.type !== "network")
          positionY += Session.get('boundaryNodeHeight')/2;
        return positionY;
      }
    }
  });

  var randomMiddleCentered = function(){
    return 500+((Math.random()-0.5)*500);
  };

  var panMatrix = function(dx, dy){
    var currentMatrix = Session.get('matrix');
    if(!isNaN(dx))
      currentMatrix[4] += dx;
    if(!isNaN(dy))
      currentMatrix[5] += dy;
    Session.set('matrix', currentMatrix);
  };
  var zoomMatrix = function(zoom){
    if(!isNaN(zoom)){
        var currentMatrix = Session.get('matrix');
        for (var i=0; i<currentMatrix.length; i++)
        {
          currentMatrix[i] *= zoom;
        }
        currentMatrix[4] += (1-zoom)*Session.get('windowWidth')/2;
        currentMatrix[5] += (1-zoom)*Session.get('windowHeight')/2;
        Session.set('matrix', currentMatrix);
    }
  };

  Template.board.events({
    'click #addNetworkNode': function () {
      Nodes.insert({
        "type":"network",
        "positionX":randomMiddleCentered(),
        "positionY":randomMiddleCentered()
      });
    },
    'click #addBoundaryNode': function () {
      Nodes.insert({
        "type":Random.choice(["input","output","inputAndOutput"]),
        "positionX":randomMiddleCentered(),
        "positionY":randomMiddleCentered()
      });
    },
    'click #addConnector': function () {
      var source = Random.choice(Nodes.find({$or:[{'type':"network"},{'type':"input"},{'type':"inputAndOutput"}]}).fetch());
      var targets;
      if(source.type === "network"){
        targets = Nodes.find({$or:[{'type':"network",_id:{$ne:source._id}},{'type':"output",_id:{$ne:source._id}},{'type':"inputAndOutput",_id:{$ne:source._id}}]}).fetch();
      }else if(source.type === "input" || source.type === "inputAndOutput"){
        targets = Nodes.find({'type':"network",_id:{$ne:source._id}}).fetch();
      }
      var target = Random.choice(targets);
      Connectors.insert({sourceId:source._id, targetId:target._id});
    },
    'click .pan': function(event){
      var target = $(event.currentTarget);
      var dx = parseInt(target.data('dx'),10);
      var dy = parseInt(target.data('dy'),10);
      panMatrix(dx, dy);
    },
    'click .zoom': function(event){
      var target = $(event.currentTarget);
      var zoom = parseFloat(target.data('zoom'));
      zoomMatrix(zoom);
    }
  });
}