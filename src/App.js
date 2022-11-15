import Model from './components/model';

function App() {
  return (
    <div className="App">
      <Model width={500} rows={9} cols={9} district_size={9} voters_interactive={true} districts_interactive={true} gridtype="random" random_distribution={[40, 41]} /*preset_district_shape={[3,3]}*/ title="Gerrymander red to power!" id={0}/>
    </div>
  );
}

export default App;