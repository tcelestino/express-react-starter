var mountNode = document.body;

var AppView = React.createClass({
  render: function () {
    return (
      <div className='container'>
      </div>
    );
  }
});

React.renderComponent(<AppView />, mountNode);
