
var color = d3.scale.category20();
var colorScheme = {
  "A": 0,
  "T": 1,
  "G": 2,
  "C": 3
}
var force = d3.layout.force()
  .charge(-300)
  .linkDistance(50)

var Model = React.createClass({
  getInitialState: function() {
    this.drag = force.drag().on('dragstart', this.dragstart);
    this.selected_node = null;

    return {};
  },

  shouldComponentUpdate(nextProps, nextState) {
    this.d3Graph = d3.select(ReactDOM.findDOMNode(this.refs.graph));

    var d3Nodes = this.d3Graph.selectAll('.node')
      .data([]).exit().remove();

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

    force.nodes(nextProps.nodes).links(nextProps.links);
    force.start();

    return true;
  },

  componentDidMount: function() {
    this.d3Graph = d3.select(ReactDOM.findDOMNode(this.refs.graph));
    this.drag_line = this.d3Graph.append("line")
      .attr("class", "drag_line_hidden")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", 0);
    force.on('tick', (tick) => {
      this.d3Graph.call(this.updateGraph);
    });
  },

  dblclick: function(d) {
    if(this.selected_node === null) {
      this.selected_node = d;

      var w = d3.select(window)
      .on("mousemove", this.mousemove);

      this.drag_line
      .attr("class", "drag_line")
      .attr("x1", this.selected_node.x)
      .attr("y1", this.selected_node.y)
      .attr("x2", this.selected_node.x)
      .attr("y2", this.selected_node.y);
    } else if(d === this.selected_node) {
      this.selected_node = null;
      this.drag_line
        .attr("class", "drag_line_hidden")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", 0);
    } else {
      console.log('another base');
      console.log(d)
      console.log(this.selected_node);
      this.drag_line
        .attr("class", "drag_line_hidden")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", 0);
      this.props.addLink(this.selected_node.key, d.key);
      this.selected_node = null;
    }
  },

  dragstart: function(d) {
    d3.select(this).classed("fixed", d.fixed = true);
  },

  enterLink: function(selection) {
    selection.classed('link', true)
      .attr("stroke-width", (d) => d.strokeWidth);
  },

  enterNode: function(selection) {
    function handleMouseOver(d) {
      d3.select(this).attr({
        r: d.size * 2
      });
      document.getElementById('sequence').children[d.key].classList.add('highlight');
    }

    function handleMouseOut(d) {
      d3.select(this).attr({
        r: d.size
      });
      document.getElementById('sequence').children[d.key].classList.remove('highlight');
    }

    selection.classed('node', true);

    selection.append('circle')
      .attr("r", (d) => d.size)
      .on('mouseover', handleMouseOver)
      .on('mouseout', handleMouseOut)
      .call(this.drag)
      .on('dblclick', this.dblclick)

    selection.append('text')
      .attr("x", (d) => d.size + 5)
      .attr("dy", ".35em")
      .text((d) => d.base);
  },

  mousemove: function() {
    if(!this.selected_node) {
      return;
    }
    this.drag_line
      .attr("x1", this.selected_node.x)
      .attr("y1", this.selected_node.y)
      .attr("x2", d3.mouse(this.d3Graph.node())[0])
      .attr("y2", d3.mouse(this.d3Graph.node())[1]);
  },

  toggleHighlight: function(node, event) {
    this.d3Graph = d3.select(ReactDOM.findDOMNode(this.refs.graph));
    var nodeCircle = this.d3Graph.selectAll('.node')
      .filter(function (d) { return d.key === node.key;})
      .select('circle')

    if(event.target.classList.contains('highlight')) {
      event.target.classList.remove('highlight');
      nodeCircle.attr({r: node.size})
    } else {
      event.target.classList.add('highlight');
      nodeCircle.attr({r: node.size * 2})
    }
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

  renderSequence: function() {
    var sequence = this.props.nodes.map((node, i) => {
      return (
        <span
          className="sequence-base"
          onMouseOver={this.toggleHighlight.bind(this, node)}
          onMouseLeave={this.toggleHighlight.bind(this, node)}
          key={i}
        >
          {node.base}
        </span>
      )
    });

    return sequence;
  },

  render: function() {
    return (
      <div>
        <div id="sequence">{this.renderSequence()}</div>
        <div id="dbn">{this.props.dbn}</div>
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
      dbn: "",
      error: "",
      links: [
        {source: 0, target: 1, strokeWidth: 5, key: 0},
        {source: 1, target: 2, strokeWidth: 5, key: 1}
      ],
      nodes: [
        {base: "A", group: 0, size: 5, key: 0, x: 300, y: 300},
        {base: "T", group: 1, size: 5, key: 1, x: 300, y: 500},
        {base: "C", group: 2, size: 5, key: 2, x: 300, y: 600}
      ],
      svgHeight: svgHeight,
      svgWidth: svgWidth
    }
  },

  componentWillMount() {
    force.size([this.state.svgWidth, this.state.svgHeight]);
  },

  componentDidMount() {
    //TODO: just for testing, remove later:
    this.setState({error: 'testing'});
  },

  addLink: function(source, target) {
    var links = this.state.links.slice();
    links.push({
      source: source,
      target: target,
      strokeWidth: 5,
      key: links.length + 1
    });

    var dbn = this.state.dbn;

    if(source < target) {
      dbn = dbn.slice(0, source) + '(' + dbn.slice(source + 1, target) + ')' + dbn.slice(target + 1);
    } else {
      dbn = dbn.slice(0, target) + '(' + dbn.slice(target + 1, source) + ')' + dbn.slice(source + 1);
    }

    this.setState({
      dbn: dbn,
      links: links
    });
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
        links.push({source: i - 1, target: i, strokeWidth: 2, key: i});
      }
      if(dbn[i] === "(") {
        basePairStack.push(i);
      }
      if(dbn[i] === ")") {
        if(basePairStack.length === 0) {
          this.setState({error: "Invalid DBN.  Missing starting parenthesis"});
          return;
        } else {
          links.push({source: basePairStack.pop(), target: i, strokeWidth: 4, key: i + '.1'});
        }
      }
    }

    if(basePairStack.length > 0) {
      this.setState({error: "Invalid DBN.  Missing closing parenthesis"});
      return;
    }

    console.log('nodes: ', nodes)
    console.log('links: ', links)

    this.setState({
      dbn: dbn,
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
          addLink={this.addLink}
          dbn={this.state.dbn}
          links={this.state.links}
          nodes={this.state.nodes}
          svgHeight={this.state.svgHeight}
          svgWidth={this.state.svgWidth}
          toggleHighlight={this.toggleHighlight}
        />
      </div>
    )
  }

});

ReactDOM.render(<App/>, document.getElementById('root'));