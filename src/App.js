import './App.css';
import React from 'react';

function SplitPane(props){
  //Sets up the side by side pane for the name and stats results
  if(props.selected){
    return(
      <div className="Results-all">
        <div id="Names" className = "Results-names">
          {props.NameResults}
        </div>
        <div className= "Results-child-stats">
          {props.PlayerStats}
        </div>
      </div>
  );
  }
  return(
    <div className="Results-all">
    <div id="emptyNames" className = "Results-names">
      {props.NameResults}
    </div>
    </div>
  )
}

class PlayerSearch extends React.Component{
//Overarching component where global states reside
//Calls other classes that are more specific to their items
  constructor(props){
    super(props);
    this.state= {name:'',listOfPlayerIds:[],listOfPlayerNames:[],listofPlayerTeams:[],selectedPlayerId:'',selectedPlayerInfo:'',posFilter:'N/A'};
    this.searchForPlayer = this.searchForPlayer.bind(this);
    this.postPlayerStats = this.postPlayerStats.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.filterPlayerPos = this.filterPlayerPos.bind(this);
  }
  handleNameChange(_name){
    this.setState({name: _name});
  }
  searchForPlayer(event){
    //get player names from API, returns a list of players with that name plus their playerIds and teams to the state
    this.setState({selectedPlayerId:''});
    let searchName = this.state.name.replace(" ","%20");
    searchName = searchName +"%25";
    let matches = 0;
    fetch("http://lookup-service-prod.mlb.com/json/named.search_player_all.bam?sport_code='mlb'&active_sw='Y'&name_part='"+searchName+"'")
    .then(res =>res.json())
    .then(
      (result)=> {
        matches = result.search_player_all.queryResults.totalSize;
        if(matches > 1){
          const positions = result.search_player_all.queryResults.row.map(res=> res.position);
          var indices = [...Array(positions.length).keys()];
          if(this.state.posFilter != 'N/A'){
            indices =[];
            var idx = positions.indexOf(this.state.posFilter);
            while (idx != -1) {
              indices.push(idx);
              idx = positions.indexOf(this.state.posFilter, idx + 1);
          }
        }
          this.setState({
            listOfPlayerIds: result.search_player_all.queryResults.row.map(res=> res.player_id).filter((item,index) =>indices.includes(index)),
            listOfPlayerNames: result.search_player_all.queryResults.row.map(res=> res.name_display_first_last).filter((item,index) =>indices.includes(index)),
            listOfPlayerTeams: result.search_player_all.queryResults.row.map(res=> res.team_abbrev).filter((item,index) =>indices.includes(index))
          });
        }
        else if(matches == 1 && (result.search_player_all.queryResults.row.position == this.state.posFilter || this.state.posFilter =='N/A')){
          this.setState({
            listOfPlayerIds: [result.search_player_all.queryResults.row.player_id],
            listOfPlayerNames: [result.search_player_all.queryResults.row.name_display_first_last],
            listOfPlayerTeams: [result.search_player_all.queryResults.row.team_abbrev]
          });
        }
        else{
          this.setState({
            listOfPlayerIds: [],
            listOfPlayerNames: [],
            listOfPlayerTeams: []
          });
          alert('No results found');
        }
        console.log(this.state.listOfPlayers);
      },
      (error)=> {
        this.setState({
          listOfPlayerIds: [],
          listOfPlayerNames: [],
          listOfPlayerTeams: []
        });
        alert('Error retreving results');
      }
      )
    event.preventDefault();
  }
  filterPlayerPos(event){
    //Sets the player position filter
    this.setState({posFilter: event.target.value});
    if(this.state.name != '') this.searchForPlayer(event);
  }
  postPlayerStats(value){
    //sets selected player state and retrieves stats from API
    this.setState({
      selectedPlayerId: value
    });
    fetch("http://lookup-service-prod.mlb.com/json/named.player_info.bam?sport_code='mlb'&player_id='"+value+"'")
    .then(res=>res.json())
    .then((result)=>{
      this.setState({
        selectedPlayerBC: result.player_info.queryResults.row.birth_country,
        selectedPlayerName: result.player_info.queryResults.row.name_display_first_last,
        selectedPlayerCollege:result.player_info.queryResults.row.college,
        selectedPlayerAge: result.player_info.queryResults.row.age,
        selectedPlayerDebutDate: result.player_info.queryResults.row.pro_debut_date,
        selectedPlayerPrimaryPos: result.player_info.queryResults.row.primary_position_txt,
        selectedPlayerNickName:result.player_info.queryResults.row.name_nick
      });
    })
  }

  render(){
    const _name = this.state.name;
    const _listOfPlayerIds = this.state.listOfPlayerIds;
    const _listOfPlayerNames = this.state.listOfPlayerNames;
    const _listOfPlayerTeams = this.state.listOfPlayerTeams;
    return(
      <div>
        <NameForm 
        name = {_name}
        onNameChange = {this.handleNameChange}
        onNameSubmit = {this.searchForPlayer}
        onPosFilter = {this.filterPlayerPos}
        /> 
        <SplitPane
          selected={this.state.selectedPlayerId}
          NameResults={<PlayerList players={_listOfPlayerNames} teams={_listOfPlayerTeams} playerIds={_listOfPlayerIds} onSelect={this.postPlayerStats} onFilter={this.filterPlayerPos}/>}
          PlayerStats={<PlayerStats playerId={this.state.selectedPlayerId} 
          playerBC={this.state.selectedPlayerBC} 
            playerName={this.state.selectedPlayerName} 
            playerCollege={this.state.selectedPlayerCollege}
            playerAge={this.state.selectedPlayerAge}
            playerDebut={this.state.selectedPlayerDebutDate}
            playerPP={this.state.selectedPlayerPrimaryPos}
            playerNN={this.state.selectedPlayerNickName}
          />}
        />
      </div>
    )
  }
}

class NameForm extends React.Component{
  //Search bar portion of the player search
  constructor(props){
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handlePosFilter = this.handlePosFilter.bind(this);
  }

  handleChange(event){
    this.props.onNameChange(event.target.value);
  }

  handleSubmit(event){
    this.props.onNameSubmit(event);
  }
  handlePosFilter(event){
    this.props.onPosFilter(event);
  }

  render(){
    const name = this.props.name;
    return(
      <form onSubmit={this.handleSubmit} className="InputSection">
        <label>
        Name:
          <input id="searchField" type="text" value={name} placeholder="Enter a Name" onChange={this.handleChange} />
        </label>
        <label>Position:
            <select id="positionField" name="Positions" onChange={this.handlePosFilter}>
              <option value='N/A'>-</option>
              <option value='C'>C</option>
              <option value='1B'>1B</option>
              <option value='2B'>2B</option>
              <option value='3B'>3B</option>
              <option value='LF'>LF</option>
              <option value='CF'>CF</option>
              <option value='RF'>RF</option>
              <option value='P'>P</option>
              </select>
          </label>
        <input id="submit" type="submit" value="Submit" />
      </form>
      
    );
  }
}

function ListItem(props) {
  // sets player names as a list item
  return <li onClick={props.onClick} value={props.playerId}>{props.playerName} {props.playerTeam}</li>;
}

class PlayerList extends React.Component {
  constructor(props){
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.handlePosFilter = this.handlePosFilter.bind(this);
  }
  handleClick(event){
    this.props.onSelect(event.target.value);
  }
  handlePosFilter(event){
    this.props.onFilter(event);
  }
  render(){
    let players=[];
    const playerNames = this.props.players;
    const playerTeams = this.props.teams;
    const playerIds = this.props.playerIds;
    for(let i=0;i<this.props.players.length;i++){
      players[i] = {name:playerNames[i], team:playerTeams[i], playerId:playerIds[i]};
    }
    // const players = props.players +"/t"+ props.teams;
    const listItems = players.map((player) =>
      // Correct! Key should be specified inside the array.
      <ListItem key={player.playerId} playerName={player.name} playerId={player.playerId} playerTeam={player.team} onClick={this.handleClick}/>
    );
    return (
      <div className="PlayerList">
        {listItems}
      </div>
    );
  }
}

class PlayerStats extends React.Component{
  render(){
    if(!this.props.playerId) return(null);
    return(<div>
      <h1>{this.props.playerName}</h1>
      <p>Birth Country: {this.props.playerBC}</p> 
      <p>College: {(this.props.playerCollege) ? this.props.playerCollege:'N/A'}  </p>
      <p>Age: {this.props.playerAge} </p> 
      <p>Debut: {this.props.playerDebut} </p> 
      <p>Primary Position: {this.props.playerPP}</p> 
      <p>Nickname: {(this.props.playerNN) ? this.props.playerNN:'N/A'}</p>
      
    </div>
      );
  }

}

function App() {
  return (
    <div id="overall">
      <p id="heading"> MLB Player Search</p>
      <PlayerSearch/>
    </div>
  );
}

export default App;
