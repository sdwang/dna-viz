
var color = d3.scale.category20();
var colorScheme = {
  "A": 0,
  "T": 1,
  "G": 2,
  "C": 3
}

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
          "strokeWidth": this.props.datum.strokeWidth
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
    var svgWidth = 1200;
    var svgHeight = 1200;
    var force = d3.layout.force()
      .charge(-120)
      .linkDistance(30)
      .size([svgWidth, svgHeight]);

    return {
      bases: "AT",
      dbn: "()",
      error: "",
      force: force,
      links: [{source: 1, target: 0, strokeWidth: 2}],
      nodes: [{base: "A", group: 0}, {base: "T", group: 1}],
      svgHeight: svgHeight,
      svgWidth: svgWidth
    }
  },

  shouldComponentUpdate(nextProps, nextState) {
    this.updateGraph(nextState.nodes, nextState.links);
    return true
  },

  componentDidMount: function() {
    this.updateGraph(this.state.nodes, this.state.links);
    this.state.force.on('tick', (tick, b, c) => {
      this.forceUpdate();
    });
  },

  updateGraph: function(nodes, links) {
    this.state.force
    .nodes(nodes)
    .links(links)
    .start();
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
        group: colorScheme[sequence[i]]
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
        <button onClick={this.updateSequence}/>
        <div id="error">{this.state.error}</div>
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
