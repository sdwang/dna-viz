
var color = d3.scale.category20();
var colorScheme = {
  "A": 0,
  "T": 1,
  "G": 2,
  "C": 3
}

var Model = React.createClass({
  getInitialState: function() {
    var force = d3.layout.force()
      .charge(-300)
      .linkDistance(50)
      .size([this.props.svgWidth, this.props.svgHeight]);

    this.drag = force.drag().on('dragstart', this.dragstart);

    return {
      bases: "AT",
      dbn: "()",
      force: force
    }
  },

  shouldComponentUpdate(nextProps, nextState) {
    this.d3Graph = d3.select(ReactDOM.findDOMNode(this.refs.graph));

    var d3Nodes = this.d3Graph.selectAll('.node')
      .data(nextProps.nodes, (node) => node.key);
    d3Nodes.enter().append('g').call(this.enterNode);
    d3Nodes.exit().remove();
    d3Nodes.call(this.updateNode);

    var d3Links = this.d3Graph.selectAll('.link')
      .data(nextProps.links, (link) => link.key);
    d3Links.enter().insert('line', '.node').call(this.enterLink);
    d3Links.exit().remove();
    d3Links.call(this.updateLink);

    this.state.force.nodes(nextProps.nodes).links(nextProps.links);
    this.state.force.start();

    return false;
  },

  componentDidMount: function() {
    this.d3Graph = d3.select(ReactDOM.findDOMNode(this.refs.graph));
    this.state.force.on('tick', (tick) => {
      this.d3Graph.call(this.updateGraph);
    });
  },

  dblclick: function(d) {
    d3.select(this).classed("fixed", d.fixed = false);
  },

  dragstart: function(d) {
    d3.select(this).classed("fixed", d.fixed = true);
  },

  enterLink: function(selection) {
    selection.classed('link', true)
      .attr("stroke-width", (d) => d.strokeWidth);
  },

  enterNode: function(selection) {
    selection.classed('node', true);

    selection.append('circle')
      .attr("r", (d) => d.size)
      .call(this.drag)

    selection.append('text')
      .attr("x", (d) => d.size + 5)
      .attr("dy", ".35em")
      .text((d) => d.base);
  },

  updateGraph: function(selection) {
    console.log('updating graph')
    selection.selectAll('.node')
      .call(this.updateNode);
    selection.selectAll('.link')
      .call(this.updateLink);
  },

  updateLink: function(selection) {
    selection.attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);
  },

  updateNode: function(selection) {
    selection.attr("transform", (d) => "translate(" + d.x + "," + d.y + ")");
  },

  render: function() {
    return (
      <div>
        <svg width={this.props.svgWidth} height={this.props.svgHeight}>
          <g ref='graph' />
        </svg>
      </div>
    )
  }
});

var App = React.createClass({
  getInitialState: function() {
    var svgWidth = 1200;
    var svgHeight = 1200;

    return {
      error: "",
      links: [{source: 1, target: 0, strokeWidth: 5}],
      nodes: [{base: "A", group: 0, size: 5, key: 0, x: 300, y: 300}, {base: "T", group: 1, size: 5, key: 1, x: 300, y: 500}],
      svgHeight: svgHeight,
      svgWidth: svgWidth
    }
  },

  componentDidMount() {
    //TODO: just for testing, remove later:
    this.setState({error: 'testing'});
  },

  updateSequence: function() {
    var sequence = document.getElementById('input-sequence').value;
    var dbn = document.getElementById('input-dbn').value;

    if(sequence.length !== dbn.length) {
      this.setState({error: "Sequence and DBN length do not match"});
      return;
    }

    var nodes = [];

    for(var i = 0; i < sequence.length; i++) {
      if(colorScheme[sequence[i]] === undefined) {
        this.setState({error: 'Invalid sequence.  May only contain "A" , "T" , "G", or "C"'});
        return;
      }

      nodes.push({
        base: sequence[i],
        group: colorScheme[sequence[i]],
        key: i,
        size: 5
      });
    }

    var links = [];
    var basePairStack = [];

    for(var i = 0; i < dbn.length; i++) {
      if(".()".indexOf(dbn[i]) === -1) {
        this.setState({error: 'Invalid DBN.  May only contain " ( " , " ) " , or " . "'});
        return;
      }
      if(i > 0) {
        links.push({source: i - 1, target: i, strokeWidth: 2});
      }
      if(dbn[i] === "(") {
        basePairStack.push(i);
      }
      if(dbn[i] === ")") {
        if(basePairStack.length === 0) {
          this.setState({error: "Invalid DBN.  Missing starting parenthesis"});
          return;
        } else {
          links.push({source: basePairStack.pop(), target: i, strokeWidth: 4});
        }
      }
    }

    if(basePairStack.length > 0) {
      this.setState({error: "Invalid DBN.  Missing closing parenthesis"});
      return;
    }

    console.log(nodes)
    console.log(links)

    this.setState({
      error: "",
      nodes: nodes,
      links: links
    });
  },

  render: function() {
    return (
      <div>
        <input id="input-sequence" type="text"/>
        <input id="input-dbn" type="text"/>
        <button className="display-btn" onClick={this.updateSequence}>Display</button>
        <div id="error">{this.state.error}</div>
        <Model
          links={this.state.links}
          nodes={this.state.nodes}
          svgHeight={this.state.svgHeight}
          svgWidth={this.state.svgWidth}
        />
      </div>
    )
  }

});

ReactDOM.render(<App/>, document.getElementById('root'));
