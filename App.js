
var color = d3.scale.category20();

var Link = React.createClass({
  render: function() {
    return (
      <line
        x1={this.props.datum.source.x}
        y1={this.props.datum.source.y}
        x2={this.props.datum.target.x}
        y2={this.props.datum.target.y}
        style={{
          "stroke":"#999",
          "strokeOpacity":".6",
          "strokeWidth": Math.sqrt(this.props.datum.value)
        }}
      />
    );
  }
});

var Node = React.createClass({
  render: function() {
    return (
        <circle
          r={5}
          cx={this.props.x}
          cy={this.props.y}
          style={{
            "fill": color(this.props.group),
            "stroke":"#fff",
            "strokeWidth":"1.5px"
          }}
        />
    )
  }
});


var Model = React.createClass({
  drawLinks: function() {
    var links = this.props.links.map(function (link, index) {
      return (<Link datum={link} key={index} />)
    })
    return (<g>
      {links}
    </g>)
  },

  drawNodes: function() {
    var nodes = this.props.nodes.map(function (node, index) {
      return (<Node
        key={index}
        x={node.x}
        y={node.y}
        group={node.group}/>
      ) })
    return nodes;
  },

  render: function() {
    return (
      <div>
        <div>{this.props.bases}</div>
        <div>{this.props.dbn}</div>
        <svg
          style={{"border": "2px solid black", "margin": "20px"}}
          width={this.props.svgWidth}
          height={this.props.svgHeight}>
          {this.drawLinks()}
          {this.drawNodes()}
        </svg>
      </div>
    )
  }

});


var App = React.createClass({
  getInitialState: function() {
    var svgWidth = 500;
    var svgHeight = 500;
    var force = d3.layout.force()
      .charge(-120)
      .linkDistance(30)
      .size([svgWidth, svgHeight]);

    return {
      svgWidth: svgWidth,
      svgHeight: svgHeight,
      force: force,
      bases: "AT",
      dbn: "()",
      nodes: [{name: "A"}, {name: "T"}],
      links: [{source: 1, target: 0, value: 3}]
    }
  },

  componentDidMount: function() {
    this.updateGraph(this.state.nodes, this.state.links);
    this.state.force.on('tick', (tick, b, c) => {
      this.forceUpdate();
    });
  },

  shouldComponentUpdate(nextProps, nextState) {
    this.updateGraph(nextState.nodes, nextState.links);
    return true
  },

  componentWillMount: function() {
    var self = this;
    setTimeout(function() {
      self.setState({
        nodes: [{name: "A"}, {name: "T"}, {name: "C"}],
        links: [{source: 1, target: 0, value: 3}]
      })
    }, 5000)
  },

  updateGraph: function(nodes, links) {
    this.state.force
      .nodes(nodes)
      .links(links)
      .start();
  },

  render: function() {
    return (
      <div>
        <Model
          bases={this.state.bases}
          dbn={this.state.dbn}
          nodes={this.state.nodes}
          links={this.state.links}
          svgWidth={this.state.svgWidth}
          svgHeight={this.state.svgHeight}
        />
      </div>
    )
  }

});

ReactDOM.render(<App/>, document.getElementById('root'));
