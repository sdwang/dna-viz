
var Model = React.createClass({

  render: function() {
    return (
      <div>
        <div>{this.props.bases}</div>
        <div>{this.props.dbn}</div>
      </div>
    )
  }

});


var App = React.createClass({

  getInitialState: function() {
    return {
      bases: "ACTGC",
      dbn: "...()"
    }
  },

  render: function() {
    return (
      <div>
        <Model
          bases={this.state.bases}
          dbn={this.state.dbn}
        />
      </div>
    )
  }

});

ReactDOM.render(<App/>, document.getElementById('root'));
