
var color = d3.scale.category10();
var colors = ["Blue", "Orange", "Green", "Red", "Purple", "Brown", "Pink", "Gray", "Light Green", "Teal"];

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

    if(this.isColorSchemeNew(nextProps.colorScheme)) {
      this.d3Graph.selectAll('.node').select('circle')
      .style('fill', (d) => color(nextProps.colorScheme[d.base]))
    }

    if(this.props.strokeWidthBackbone !== nextProps.strokeWidthBackbone) {
      this.d3Graph.selectAll('.link.backbone')
        .style('stroke-width', nextProps.strokeWidthBackbone);
    }

    if(this.props.strokeWidthBasePair !== nextProps.strokeWidthBasePair) {
      this.d3Graph.selectAll('.link.base-pair')
        .style('stroke-width', nextProps.strokeWidthBasePair);
    }

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
      .attr("stroke-width", (d) => {
        if(d.class === "backbone") {
          return this.props.strokeWidthBackbone;
        } else if(d.class === "base-pair") {
          return this.props.strokeWidthBasePair;
        }
      })
      .attr("class", (d) => 'link ' + d.class);
  },

  enterNode: function(selection) {
    var self = this;
    function handleMouseOver(d) {
      d3.select(this).attr({
        r: self.props.nodeSize * 2
      });
      document.getElementById('sequence').children[d.key].classList.add('highlight');
    }

    function handleMouseOut(d) {
      d3.select(this).attr({
        r: self.props.nodeSize
      });
      document.getElementById('sequence').children[d.key].classList.remove('highlight');
    }

    selection.classed('node', true);

    selection.append('circle')
      .attr("r", this.props.nodeSize)
      .style("fill", (d) => color(this.props.colorScheme[d.base]))
      .on('mouseover', handleMouseOver)
      .on('mouseout', handleMouseOut)
      .call(this.drag)
      .on('dblclick', this.dblclick)

    selection.append('text')
      .attr("x", Number(this.props.nodeSize) + 5)
      .attr("dy", ".35em")
      .style("font-size", this.props.labelFontSize)
      .text((d) => {
        if(d.key === 0) {
          return "5': " + d.base;
        } else if(d.key === selection[0].length - 1) {
          return "3': " + d.base;
        } else {
          return d.base;
        }
      });
  },

  isColorSchemeNew(colorScheme) {
    for(var k in colorScheme) {
      if(this.props.colorScheme[k] !== colorScheme) {
        return true;
      }
    }
    return false;
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
      nodeCircle.attr({r: this.props.nodeSize})
    } else {
      event.target.classList.add('highlight');
      nodeCircle.attr({r: this.props.nodeSize * 2})
    }
  },

  updateGraph: function(selection) {
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
    return {
      colorScheme: {
        "A": 2,
        "T": 4,
        "G": 3,
        "C": 10
      },
      dbn: "",
      error: "",
      labelFontSize: 12,
      links: [],
      nodes: [],
      nodeSize: 10,
      strokeWidthBackbone: 2,
      strokeWidthBasePair: 5,
      svgHeight: 900,
      svgWidth: 900
    }
  },

  componentWillMount() {
    force.size([this.state.svgWidth, this.state.svgHeight]);
  },

  componentDidMount() {
    var pathname = window.location.pathname.split('/');
    if(window.location.pathname.split('/').length === 3) {
      var sequence = pathname[1];
      var dbn = pathname[2];

      document.getElementById('input-sequence').value = sequence;
      document.getElementById('input-dbn').value = dbn;
    }
  },

  addLink: function(source, target) {
    var links = this.state.links.slice();
    links.push({
      source: source,
      target: target,
      strokeWidth: 5,
      key: links.length + 1,
      class: 'base-pair'
    });

    var dbn = this.state.dbn;

    if(source < target) {
      dbn = dbn.slice(0, source) + '(' + dbn.slice(source + 1, target) + ')' + dbn.slice(target + 1);
    } else {
      dbn = dbn.slice(0, target) + '(' + dbn.slice(target + 1, source) + ')' + dbn.slice(source + 1);
    }

    document.getElementById('input-dbn').value = dbn;

    this.setState({
      dbn: dbn,
      links: links
    });
  },

  generateColorOptions: function(base) {
    var options = [];
    for(var i = 0; i < 10; i++) {
      options.push(
        <option
          value={i}
          key={i}
          style={{backgroundColor: color(i)}}
          onClick={this.updateColorScheme.bind(this, base, i)}
        >
          {colors[i]}
        </option>
      );
    }

    return options;
  },

  shareLink: function() {
    var link = window.location.origin +
      '/' + document.getElementById('input-sequence').value +
      '/' + document.getElementById('input-dbn').value;

    var shareLinkInput = document.getElementById('share-link');
    shareLinkInput.value = link;
    shareLinkInput.classList.remove('collapse');
    shareLinkInput.classList.add('expand');
    shareLinkInput.focus();
    shareLinkInput.select();

  },

  updateColorScheme: function(base, event) {
    //TODO: add immutability helper
    var newColorScheme = {};
    for(var k in this.state.colorScheme) {
      if(k === base) {
        newColorScheme[k] = event.target.value;
      } else {
        newColorScheme[k] = this.state.colorScheme[k];
      }
    }
    this.setState({
      colorScheme: newColorScheme
    });
  },

  //TODO: consolidate update size methods
  updateLabelFontSize: function(event) {
    var val = event.target.value;
    if(val > 32) {
      val = 32;
    } else if(val < 1) {
      val = 1;
    }
    val = Math.floor(val);
    event.target.value = val;
    this.setState({labelFontSize: event.target.value});
  },

  //TODO: consolidate update size methods
  updateNodeSize: function(event) {
    var val = event.target.value;
    if(val > 20) {
      val = 20;
    } else if(val < 1) {
      val = 1;
    }
    val = Math.floor(val);
    event.target.value = val;
    this.setState({nodeSize: event.target.value});
  },

  updateSequence: function() {
    var shareLinkInput = document.getElementById('share-link');
    shareLinkInput.value = "";
    shareLinkInput.classList.remove('expand');
    shareLinkInput.classList.add('collapse');

    var sequence = document.getElementById('input-sequence').value;
    var dbn = document.getElementById('input-dbn').value;

    if(sequence.length !== dbn.length) {
      this.setState({error: "Sequence and DBN length do not match"});
      return;
    }

    var nodes = [];

    for(var i = 0; i < sequence.length; i++) {
      if(this.state.colorScheme[sequence[i]] === undefined) {
        this.setState({error: 'Invalid sequence.  May only contain "A" , "T" , "G", or "C"'});
        return;
      }

      nodes.push({
        base: sequence[i],
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
        links.push({source: i - 1, target: i, strokeWidth: 2, key: i, class: 'backbone'});
      }
      if(dbn[i] === "(") {
        basePairStack.push(i);
      }
      if(dbn[i] === ")") {
        if(basePairStack.length === 0) {
          this.setState({error: "Invalid DBN.  Missing starting parenthesis"});
          return;
        } else {
          links.push({source: basePairStack.pop(), target: i, strokeWidth: 5, key: i + '.1', class: 'base-pair'});
        }
      }
    }

    if(basePairStack.length > 0) {
      this.setState({error: "Invalid DBN.  Missing closing parenthesis"});
      return;
    }

    this.setState({
      dbn: dbn,
      error: "",
      nodes: nodes,
      links: links
    });
  },

  //TODO: consolidate update size methods
  updateStrokeWidthBackbone: function(event) {
    var val = event.target.value;
    if(val > 10) {
      val = 10;
    } else if(val < 1) {
      val = 1;
    }
    val = Math.floor(val);
    event.target.value = val;
    this.setState({strokeWidthBackbone: event.target.value});
  },

  //TODO: consolidate update size methods
  updateStrokeWidthBasePair: function(event) {
    var val = event.target.value;
    if(val > 10) {
      val = 10;
    } else if(val < 1) {
      val = 1;
    }
    val = Math.floor(val);
    event.target.value = val;
    this.setState({strokeWidthBasePair: event.target.value});
  },

  render: function() {
    return (
      <div>
        <h1>DNA Visualizer</h1>
        <input id="input-sequence" type="text"/>
        <input id="input-dbn" type="text"/>
        <button className="display-btn" onClick={this.updateSequence}>Display</button>
        <button className="share-btn" onClick={this.shareLink}>Share</button>
        <input id="share-link" className="collapse" type="url"/>
        <div>
          <h2>
            Colors:
          </h2>
          <div>
            <span>A:</span>
            <select
              name="A"
              defaultValue={this.state.colorScheme["A"]}
              onChange={this.updateColorScheme.bind(this, "A")}
              >
                {this.generateColorOptions("A")}
              </select>
          </div>
          <div>
            <span>T:</span>
            <select
              name="T"
              defaultValue={this.state.colorScheme["T"]}
              onChange={this.updateColorScheme.bind(this, "T")}
              >
                {this.generateColorOptions("T")}
              </select>
          </div>
          <div>
            <span>G:</span>
            <select
              name="G"
              defaultValue={this.state.colorScheme["G"]}
              onChange={this.updateColorScheme.bind(this, "G")}
              >
                {this.generateColorOptions("G")}
              </select>
          </div>
          <div>
            <span>C:</span>
            <select
              name="C"
              defaultValue={this.state.colorScheme["C"]}
              onChange={this.updateColorScheme.bind(this, "C")}
              >
                {this.generateColorOptions("C")}
              </select>
          </div>
        </div>
        <div>
          <span>Node Size: </span>
          <input
            onChange={this.updateNodeSize}
            type="number"
            step="1"
            min="1"
            max="20"
            defaultValue={this.state.nodeSize}
          />
        </div>
        <div>
          <span>Base Pair Stroke Width: </span>
          <input
            onChange={this.updateStrokeWidthBasePair}
            type="number"
            step="1"
            min="1"
            max="10"
            defaultValue={this.state.strokeWidthBasePair}
          />
        </div>
        <div>
          <span>Phosphate Backbone Stroke Width: </span>
          <input
            onChange={this.updateStrokeWidthBackbone}
            type="number"
            step="1"
            min="1"
            max="10"
            defaultValue={this.state.strokeWidthBackbone}
          />
        </div>
        <div>
          <span>Label Font Size: </span>
          <input
            onChange={this.updateLabelFontSize}
            type="number"
            step="1"
            min="1"
            max="32"
            defaultValue={this.state.labelFontSize}
          />
        </div>
        <div id="error">{this.state.error}</div>
        <Model
          addLink={this.addLink}
          colorScheme={this.state.colorScheme}
          dbn={this.state.dbn}
          labelFontSize={this.state.labelFontSize}
          links={this.state.links}
          nodes={this.state.nodes}
          nodeSize={this.state.nodeSize}
          strokeWidthBackbone={this.state.strokeWidthBackbone}
          strokeWidthBasePair={this.state.strokeWidthBasePair}
          svgHeight={this.state.svgHeight}
          svgWidth={this.state.svgWidth}
          toggleHighlight={this.toggleHighlight}
        />
      </div>
    )
  }

});

ReactDOM.render(<App/>, document.getElementById('root'));
