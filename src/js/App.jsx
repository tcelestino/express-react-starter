var mountNode = document.querySelector('.content');

var AppView = React.createClass({
  render: function () {
    return (
      <div>
        <h2>Hello, world!</h2>
      </div>
    );
  }
});

React.renderComponent(<AppView />, mountNode);
