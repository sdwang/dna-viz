
var color = d3.scale.category20();
var colorScheme = {
  "A": 0,
  "T": 1,
  "G": 2,
  "C": 3
}

// var Link = React.createClass({
//   render: function() {
//     return (
//       <line
//         x1={this.props.datum.source.x}
//         y1={this.props.datum.source.y}
//         x2={this.props.datum.target.x}
//         y2={this.props.datum.target.y}
//         style={{
//           "stroke":"#999",
//           "strokeOpacity":".6",
//           "strokeWidth": this.props.datum.strokeWidth
//         }}
//       />
//     );
//   }
// });
//
// var Node = React.createClass({
//   move: function(event) {
//     console.log(event.target);
//     this.props.updateNode(this.props.index, 1);
//   },
//
//   render: function() {
//     return (
//       <circle
//         r={5}
//         cx={this.props.fx ? this.props.fx : this.props.x}
//         cy={this.props.fy ? this.props.fy : this.props.y}
//         fx={this.props.fx ? this.props.fx : null}
//         fy={this.props.fy ? this.props.fy : null}
//         style={{
//           "fill": color(this.props.group),
//           "stroke":"#fff",
//           "strokeWidth":"1.5px"
//         }}
//         onClick={this.move}
//       />
//     )
//   }
// });


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
      nodes: [{base: "A", group: 0, key: 0}, {base: "T", group: 1, key: 1}],
      svgHeight: svgHeight,
      svgWidth: svgWidth
    }
  },

  shouldComponentUpdate(nextProps, nextState) {
    // console.log(nextState.nodes)
    // this.updateGraph(nextState.nodes, nextState.links);
    // return true
  },

  componentDidMount: function() {
    this.d3Graph = d3.select(ReactDOM.findDOMNode(this.refs.graph));
    // this.updateGraph(this.state.nodes, this.state.links);
    this.state.force.on('tick', (tick) => {
      this.d3Graph.call(this.updateGraph);
    });
  },

  updateGraph: function(selection) {
    console.log('updating graph')
    selection.selectAll('.node')
      .call(updateNode);
    selection.selectAll('.link')
      .call(updateLink);
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
        key: i
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
        <button onClick={this.updateSequence}>Display</button>
        <div id="error">{this.state.error}</div>
        <svg width={this.state.svgWidth} height={this.state.svgHeight}>
          <g ref='graph' />
        </svg>
      </div>
    )
  }
});

ReactDOM.render(<App/>, document.getElementById('root'));
