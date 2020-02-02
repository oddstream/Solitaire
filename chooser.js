//@ts-check
'use strict';

const VERSION = '20.1.30.2'; // examined by bake.tcl

const Variants = [
{
    'Name':'Klondike',
    'Type':'All,Klondike,Classic,Small Screen',
    'Desc':'one pack, unlimited redeals',
    'File':'Klondike1',
    'Wikipedia':'https://en.wikipedia.org/wiki/Klondike_(solitaire)'
},
{
    'Name':'Klondike Hard',
    'Type':'All,Klondike,Hard,Small Screen',
    'Desc':'one pack, no redeals',
    'File':'Klondike1-1',
    'Wikipedia':'https://en.wikipedia.org/wiki/Klondike_(solitaire)'
},
{
    'Name':'Klondike Draw Three',
    'Type':'All,Klondike,Small Screen',
    'Desc':'one pack, draw three, unlimited redeals',
    'File':'Klondike3',
    'Wikipedia':'https://en.wikipedia.org/wiki/Klondike_(solitaire)'
},
{
    'Name':'Double Klondike',
    'Type':'All,Klondike,Two Packs',
    'Desc':'two packs, draw one, unlimited redeals',
    'File':'DoubleKlondike',
    'Wikipedia':'https://en.wikipedia.org/wiki/Klondike_(solitaire)'
},
{
    'Name':'Triple Klondike',
    'Type':'All,Klondike,Three Packs',
    'Desc':'three packs, draw one, unlimited redeals',
    'File':'TripleKlondike',
    'Wikipedia':'https://en.wikipedia.org/wiki/Klondike_(solitaire)'
},
{
    'Name':'Quadruple Klondike',
    'Type':'All,Klondike',
    'Desc':'four packs, draw one, unlimited redeals',
    'File':'QuadKlondike',
    'Wikipedia':'https://en.wikipedia.org/wiki/Klondike_(solitaire)'
},
{
    'Name':'Thoughtful',
    'Type':'All,Klondike,Small Screen',
    'Desc':'aka Saratoga. Klondike but with all tableau cards face up',
    'File':'Thoughtful',
    'Wikipedia':'https://en.wikipedia.org/wiki/Klondike_(solitaire)'
},
{
    'Name':'Lady Jane',
    'Type':'All,Klondike,Two Packs',
    'Desc':'an easy two-deck Spider/Klondike blend by Thomas Warfield',
    'File':'LadyJane',
    'Wikipedia':''
},
{
    'Name':'Blockade',
    'Type':'All,Easy,Spider,Two Packs',
    'Desc':'an easy mix of Klondike and Spider',
    'File':'Blockade',
    'Wikipedia':'https://en.wikipedia.org/wiki/Blockade_(solitaire)'
},
{
    'Name':'Napoleon\'s Square',
    'Type':'All,Easy,Forty Thieves,Two Packs',
    'Desc':'an easier version of Forty Thieves',
    'File':'NapSq',
    'Wikipedia':'https://en.wikipedia.org/wiki/Napoleon%27s_Square'
},
{
    'Name':'Whitehead',
    'Type':'All,Klondike,Easy,Small Screen',
    'Desc':'build down regardless of color, can only move cards of same suit',
    'File':'Whitehead',
    'Wikipedia':'https://en.wikipedia.org/wiki/Klondike_(solitaire)#Variations'
},
{
    'Name':'Agnes Bernauer',
    'Type':'All,Canfield,Small Screen',
    'Desc':'aka Agnes, a variation of Klondike with reserve piles',
    'File':'AgnesBernauer',
    'Wikipedia':'https://en.wikipedia.org/wiki/Agnes_(card_game)'
},
{
    'Name':'Agnes Sorel',
    'Type':'All,Canfield,Hard,Small Screen',
    'Desc':'a David Parlett original which is almost impossible to win',
    'File':'AgnesSorel',
    'Wikipedia':'https://en.wikipedia.org/wiki/Agnes_(card_game)'
},
{
    'Name':'Easthaven',
    'Type':'All,Klondike,Hard',
    'Desc':'aka Aces Up - Klondike-like with a Spider-like stock',
    'File':'Easthaven',
    'Wikipedia':''
},
{
    'Name':'Double Easthaven',
    'Type':'All,Klondike,Hard,Two Packs',
    'Desc':'aka Aces Up - Klondike-like with a Spider-like stock',
    'File':'DoubleEasthaven',
    'Wikipedia':''
},
{
    'Name':'Westcliff',
    'Type':'All,Klondike,Easy',
    'Desc':'probably the easiest game in this collection',
    'File':'Westcliff',
    'Wikipedia':'https://en.wikipedia.org/wiki/Westcliff_(solitaire)'
},
{
    'Name':'Yukon',
    'Type':'All,Yukon,Classic,Small Screen',
    'Desc':'build the tableau down by alternate color',
    'File':'Yukon',
    'Wikipedia':'https://en.wikipedia.org/wiki/Yukon_(solitaire)'
},
{
  'Name':'Russian',
  'Type':'All,Yukon,Small Screen',
  'Desc':'build the tableau down in suit',
  'File':'Russian',
  'Wikipedia':'https://en.wikipedia.org/wiki/Russian_(solitaire)'
},
{
    'Name':'Yukon One Suit',
    'Type':'All,Easy,Yukon,Small Screen,One Suit',
    'Desc':'easy version of Yukon',
    'File':'Yukon1',
    'Wikipedia':'https://en.wikipedia.org/wiki/Yukon_(solitaire)'
},
{
    'Name':'Yukon Cells',
    'Type':'All,Easy,Yukon',
    'Desc':'easy version of Yukon with two free cells',
    'File':'YukonCells',
    'Wikipedia':'https://en.wikipedia.org/wiki/Yukon_(solitaire)'
},
{
    'Name':'Double Yukon',
    'Type':'All,Yukon,Two Packs',
    'Desc':'harder version of Yukon',
    'File':'DoubleYukon',
    'Wikipedia':'https://en.wikipedia.org/wiki/Yukon_(solitaire)'
},
{

    'Name':'Alaska',
    'Type':'All,Yukon,Hard,Small Screen',
    'Desc':'a version of Yukon, but the tableau is built up or down by suit',
    'File':'Alaska',
    'Wikipedia':'https://en.wikipedia.org/wiki/Yukon_(solitaire)'
},
{
    'Name':'Brisbane',
    'Type':'All,Easy,Yukon,Small Screen',
    'Desc':'a version of Yukon, build the tableau down regardless of suit',
    'File':'Brisbane',
    'Wikipedia':'https://en.wikipedia.org/wiki/Yukon_(solitaire)'
},
{
    'Name':'Australian',
    'Type':'All,Klondike,Yukon,Easy,Small Screen',
    'Desc':'an easy mix of Klondike and Yukon, the tableau is built down by suit',
    'File':'Australian',
    'Wikipedia':'https://en.wikipedia.org/wiki/Australian_Patience'
},
{
    'Name':'Canfield',
    'Type':'All,Canfield,Classic,Small Screen',
    'Desc':'aka Fascination, Demon, Thirteen',
    'File':'Canfield',
    'Wikipedia':'https://en.wikipedia.org/wiki/Canfield_(solitaire)'
},
{
    'Name':'Rainbow',
    'Type':'All,Canfield,Small Screen',
    'Desc':'a slightly easier version of Canfield',
    'File':'Rainbow',
    'Wikipedia':'https://en.wikipedia.org/wiki/Canfield_(solitaire)'
},
{
    'Name':'Storehouse',
    'Type':'All,Canfield',
    'Desc':'an easier version of Canfield',
    'File':'Storehouse',
    'Wikipedia':'https://en.wikipedia.org/wiki/Canfield_(solitaire)'
},
{
    'Name':'American Toad',
    'Type':'All,Canfield,Two Packs,Easy',
    'Desc':'an easier version of Canfield',
    'File':'AmericanToad',
    'Wikipedia':'https://en.wikipedia.org/wiki/American_Toad_(solitaire)'
},
{
    'Name':'Golf',
    'Type':'All,Golf',
    'Desc':'move cards that are one rank higher or one rank lower than the top card of the foundation',
    'File':'Golf',
    'Wikipedia':'https://en.wikipedia.org/wiki/Golf_(patience)'
},
{
    'Name':'Golf Relaxed',
    'Type':'All,Golf',
    'Desc':'Aces and Kings can go on each other',
    'File':'GolfRelaxed',
    'Wikipedia':'https://en.wikipedia.org/wiki/Golf_(patience)'
},
{
    'Name':'Alternation',
    'Type':'All,Other,Two Packs',
    'Desc':'alternate cards face down, built up alternate colors',
    'File':'Alternation',
    'Wikipedia':'https://en.wikipedia.org/wiki/Alternation_(solitaire)'
},
{
    'Name':'Flower Garden',
    'Type':'All,Other',
    'Desc':'aka The Garden or Bouquet',
    'File':'FlowerGarden',
    'Wikipedia':'https://en.wikipedia.org/wiki/Flower_Garden_(solitaire)'
},
{
    'Name':'Brigade',
    'Type':'All,Other',
    'Desc':'easier version of Flower Garden',
    'File':'Brigade',
    'Wikipedia':'https://en.wikipedia.org/wiki/Flower_Garden_(solitaire)'
},
{
    'Name':'Carpet',
    'Type':'All,Easy,Other',
    'Desc':'easy game with twenty reserve piles, no tableau and no building',
    'File':'Carpet',
    'Wikipedia':'https://en.wikipedia.org/wiki/Carpet_(solitaire)'
},
{
    'Name':'Forty Thieves',
    'Type':'All,Forty Thieves,Classic,Two Packs,Hard',
    'Desc':'aka Napoleon at St Helena',
    'File':'FortyThieves',
    'Wikipedia':'https://en.wikipedia.org/wiki/Forty_Thieves_(card_game)'
},
{
    'Name':'Squadron',
    'Type':'All,Forty Thieves,Two Packs',
    'Desc':'Forty Thieves with three free cells',
    'File':'Squadron',
    'Wikipedia':'https://en.wikipedia.org/wiki/Forty_Thieves_(card_game)'
},
{
    'Name':'Forty and Eight',
    'Type':'All,Forty Thieves,Two Packs',
    'Desc':'easier version of Forty Thieves, allows two stock redeals',
    'File':'FortyAndEight',
    'Wikipedia':'https://en.wikipedia.org/wiki/Forty_Thieves_(card_game)'
},
{
    'Name':'Congress',
    'Type':'All,Forty Thieves,Two Packs',
    'Desc':'empty tableaux are automatically filled from waste or stock piles',
    'File':'Congress',
    'Wikipedia':'https://en.wikipedia.org/wiki/Congress_(solitaire)'
},
{
    'Name':'Parliament',
    'Type':'All,Forty Thieves,Two Packs',
    'Desc':'an easier version of Congress',
    'File':'Parliament',
    'Wikipedia':'https://en.wikipedia.org/wiki/Congress_(solitaire)'
},
{
    'Name':'Josephine',
    'Type':'All,Forty Thieves,Two Packs',
    'Desc':'aka Forty Bandits - an easier version of Forty Thieves',
    'File':'Josephine',
    'Wikipedia':'https://en.wikipedia.org/wiki/Josephine_(solitaire)'
},
{
    'Name':'Maria',
    'Type':'All,Forty Thieves,Two Packs',
    'Desc':'like Forty Thieves, but build tableau down in alternate colors',
    'File':'Maria',
    'Wikipedia':'https://en.wikipedia.org/wiki/Forty_Thieves_(card_game)'
},
{
    'Name':'Number Ten',
    'Type':'All,Forty Thieves,Two Packs',
    'Desc':'like Forty Thieves, but build tableau down in alternate colors',
    'File':'NumberTen',
    'Wikipedia':'https://en.wikipedia.org/wiki/Forty_Thieves_(card_game)'
},
{
    'Name':'Indian',
    'Type':'All,Forty Thieves,Two Packs',
    'Desc':'',
    'File':'Indian',
    'Wikipedia':'https://en.wikipedia.org/wiki/Forty_Thieves_(card_game)'
},
{
    'Name':'Lucas',
    'Type':'All,Forty Thieves,Two Packs',
    'Desc':'easier version of Forty Thieves where the foundation is seeded with aces',
    'File':'Lucas',
    'Wikipedia':'https://en.wikipedia.org/wiki/Josephine_(solitaire)'
},
{
    'Name':'Limited',
    'Type':'All,Forty Thieves',
    'Desc':'easier version of Forty Thieves with more tableaux piles',
    'File':'Limited',
    'Wikipedia':'https://en.wikipedia.org/wiki/Forty_Thieves_(card_game)'
},
{   'Name': 'Single Rail',
    'Type': 'All,Forty Thieves,Small Screen',
    'Desc': 'A single pack variation of Forty Thieves',
    'File': 'SingleRail',
},
{
    'Name':'Freecell',
    'Type':'All,Freecell,Classic,Small Screen',
    'Desc':'can move multiple tableau cards',
    'File':'Freecell',
    'Wikipedia':'https://en.wikipedia.org/wiki/Freecell'
},
{
    'Name':'Forecell',
    'Type':'All,Freecell,Small Screen',
    'Desc':'can move multiple tableau cards, cells are filled at start',
    'File':'Forecell',
    'Wikipedia':'https://en.wikipedia.org/wiki/Freecell'
},
{
    'Name':'Freecell Original',
    'Type':'All,Freecell,Small Screen',
    'Desc':'invented by Paul Alfille',
    'File':'Freecell0',
    'Wikipedia':'https://en.wikipedia.org/wiki/Freecell'
},
{
    'Name':'Freecell Easy',
    'Type':'All,Easy,Freecell,Small Screen',
    'Desc':'Kings and Aces are moved to top and bottom of tableaux stacks',
    'File':'FreecellEasy',
    'Wikipedia':'https://en.wikipedia.org/wiki/Freecell'
},
{
    'Name':'Blind Freecell',
    'Type':'All,Freecell',
    'Desc':'Freecell made harder; tableau cards are face down and cells are filled',
    'File':'BlindFreecell',
    'Wikipedia':'https://en.wikipedia.org/wiki/Freecell'
},
{
    'Name':'Sea Towers',
    'Type':'All,Freecell',
    'Desc':'aka Seahaven Towers or Seahaven, by Art Cabral',
    'File':'SeaTowers',
    'Wikipedia':'https://en.wikipedia.org/wiki/Seahaven_Towers_(solitaire)'
},
{
    'Name':'Big Freecell',
    'Type':'All,Freecell,Two Packs,Easy',
    'Desc':'a very easy straight-forward two-deck version of FreeCell',
    'File':'BigFreecell',
    'Wikipedia':'https://en.wikipedia.org/wiki/Freecell'
},
{
    'Name':'Double Freecell',
    'Type':'All,Freecell,Two Packs',
    'Desc':'Thomas Warfield\'s two-deck variation on Freecell',
    'File':'DoubleFreecell',
    'Wikipedia':'https://en.wikipedia.org/wiki/Freecell'
},
{
    'Name':'Eight Off',
    'Type':'All,Freecell',
    'Desc':'predates Freecell',
    'File':'EightOff',
    'Wikipedia':'https://en.wikipedia.org/wiki/Eight_Off'
},
{
    'Name':'Baker\'s Game',
    'Type':'All,Freecell',
    'Desc':'predates Freecell, tableau are built by suit',
    'File':'Baker\'sGame',
    'Wikipedia':'https://en.wikipedia.org/wiki/Baker%27s_Game'
},
{
    'Name':'Penguin',
    'Type':'All,Freecell',
    'Desc':'a David Parlett original',
    'File':'Penguin',
    'Wikipedia':'http://www.parlettgames.uk/patience/penguin.html'
},
{
    'Name':'Tuxedo',
    'Type':'All,Freecell',
    'Desc':'an easier version of Penguin',
    'File':'Tuxedo',
    'Wikipedia':'https://politaire.com/help/tuxedo'
},
{
    'Name':'Scorpion',
    'Type':'All,Scorpion,Classic,Small Screen',
    'Desc':'related to Spider, the method of game play is like Yukon',
    'File':'Scorpion',
    'Wikipedia':'https://en.wikipedia.org/wiki/Scorpion_(solitaire)'
},
{
    'Name':'Three Blind Mice',
    'Type':'All,Scorpion',
    'Desc':'a variation of Scorpion with a two-card reserve',
    'File':'ThreeBlindMice',
    'Wikipedia':'https://en.wikipedia.org/wiki/Scorpion_(solitaire)'
},
{
    'Name':'Double Scorpion',
    'Type':'All,Hard,Scorpion,Two Packs',
    'Desc':'a two deck version of Scorpion, all cards are already dealt at the beginning',
    'File':'DoubleScorpion',
    'Wikipedia':'https://en.wikipedia.org/wiki/Scorpion_(solitaire)'
},
{
    'Name':'Triple Scorpion',
    'Type':'All,Scorpion,Three Packs',
    'Desc':'a three deck version of Scorpion, all cards are already dealt at the beginning',
    'File':'TripleScorpion',
    'Wikipedia':'https://en.wikipedia.org/wiki/Scorpion_(solitaire)'
},
{
    'Name':'Wasp',
    'Type':'All,Easy,Scorpion,Small Screen',
    'Desc':'easy version of Scorpion, allows any card to be placed on empty column',
    'File':'Wasp',
    'Wikipedia':'https://en.wikipedia.org/wiki/Scorpion_(solitaire)'
},
{
    'Name':'Spider One Suit',
    'Type':'All,Spider,Easy,Classic,One Suit',
    'Desc':'easy version of Spider with only spades',
    'File':'Spider1',
    'Wikipedia':'https://en.wikipedia.org/wiki/Spider_(solitaire)'
},
{
    'Name':'Spider Two Suits',
    'Type':'All,Spider,Two Suits',
    'Desc':'easier version of Spider with only spades and hearts',
    'File':'Spider2',
    'Wikipedia':'https://en.wikipedia.org/wiki/Spider_(solitaire)'
},
{
    'Name':'Spider',
    'Type':'All,Spider,Two Packs',
    'Desc':'made famous by Microsoft, though it dates back at least to 1949',
    'File':'Spider4',
    'Wikipedia':'https://en.wikipedia.org/wiki/Spider_(solitaire)'
},
{
    'Name':'Spiderette One Suit',
    'Type':'All,Spider,Easy,Small Screen,One Suit',
    'Desc':'',
    'File':'Spiderette1',
    'Wikipedia':'https://en.wikipedia.org/wiki/Spider_(solitaire)'
},
{
    'Name':'Spiderette Two Suits',
    'Type':'All,Spider,Small Screen,Two Suits',
    'Desc':'',
    'File':'Spiderette2',
    'Wikipedia':'https://en.wikipedia.org/wiki/Spider_(solitaire)'
},
{
    'Name':'Spiderette',
    'Type':'All,Spider,Hard,Small Screen',
    'Desc':'',
    'File':'Spiderette4',
    'Wikipedia':'https://en.wikipedia.org/wiki/Spider_(solitaire)'
},
{
    'Name':'Simple Simon',
    'Type':'All,Easy,Simple,Spider',
    'Desc':'like a one-deck Spider where all cards start face up in a triangular tableau',
    'File':'SimpleSimon',
    'Wikipedia':'https://en.wikipedia.org/wiki/Simple_Simon_(solitaire)'
},
{
    'Name':'Fortress',
    'Type':'All,Hard,Simple,Castle',
    'Desc':'one of the oldest open solitaires and at one time one of the most popular',
    'File':'Fortress',
    'Wikipedia':'https://en.wikipedia.org/wiki/Fortress_(card_game)'
},
{
    'Name':'Cruel',
    'Type':'All,Tableau Redeal',
    'Desc':'originally for Microsoft Windows, based on Perseverance',
    'File':'Cruel',
    'Wikipedia':'https://en.wikipedia.org/wiki/Cruel_(solitaire)'
},
{
    'Name':'Unusual',
    'Type':'All,Tableau Redeal,Two Packs',
    'Desc':'a two-pack version of Cruel',
    'File':'Unusual',
    'Wikipedia':'https://en.wikipedia.org/wiki/Cruel_(solitaire)'
},
{
    'Name':'Ripple Fan',
    'Type':'All,Tableau Redeal',
    'Desc':'an easier version of Cruel',
    'File':'RippleFan',
    'Wikipedia':'https://en.wikipedia.org/wiki/Cruel_(solitaire)'
},
{
    'Name':'Perseverance',
    'Type':'All,Tableau Redeal',
    'Desc':'like Cruel, but a sequence of cards can be moved',
    'File':'Perseverance',
    'Wikipedia':'https://en.wikipedia.org/wiki/Perseverance_(solitaire)'
},
{
    'Name':'Indefatigable',
    'Type':'All,Tableau Redeal',
    'Desc':'like Royal Family, but the foundations build up from Ace, and there is an extra redeal',
    'File':'Indefatigable',
    'Wikipedia':'https://en.wikipedia.org/wiki/Perseverance_(solitaire)'
},
{
    'Name':'Beleaguered Castle',
    'Type':'All,Castle',
    'Desc':'aka Laying Siege, Sham Battle',
    'File':'BeleagueredCastle',
    'Wikipedia':'https://en.wikipedia.org/wiki/Beleaguered_Castle'
},
{
    'Name':'Stronghold',
    'Type':'All,Castle',
    'Desc':'easier Beleaguered Castle with a free cell',
    'File':'Stronghold',
    'Wikipedia':'https://en.wikipedia.org/wiki/Beleaguered_Castle'
},
{
    'Name':'Somerset',
    'Type':'All,Klondike,Hard',
    'Desc':'Klondike variant without stock or waste',
    'File':'Somerset',
    'Wikipedia':'https://politaire.com/help/somerset'
},
{
    'Name':'Somerset Relaxed',
    'Type':'All,Klondike',
    'Desc':'allows sequences of cards to be moved',
    'File':'SomersetRelaxed',
    'Wikipedia':'https://politaire.com/help/somerset'
},
{
    'Name':'Usk',
    'Type':'All,Klondike,Tableau Redeal',
    'Desc':'Klondike variant with one tableau reshuffle and no stock or waste',
    'File':'Usk',
    'Wikipedia':'https://politaire.com/help/usk'
},
{
    'Name':'Breeze',
    'Type':'All,Fan,Easy,Simple',
    'Desc':'an easier version of Fan that allows sequences of cards to be moved',
    'File':'Breeze',
    'Wikipedia':''
},
{
    'Name':'Fan',
    'Type':'All,Fan',
    'Desc':'the original fan-type game',
    'File':'Fan',
    'Wikipedia':'https://en.wikipedia.org/wiki/La_Belle_Lucie'
},
{
    'Name':'La Belle Lucie',
    'Type':'All,Fan,Tableau Redeal,Hard',
    'Desc':'a classic game first published by Lady Adelaide Cadogan in 1870',
    'File':'LaBelleLucie',
    'Wikipedia':'https://en.wikipedia.org/wiki/La_Belle_Lucie'
},
{
    'Name':'Trefoil',
    'Type':'All,Fan,Tableau Redeal',
    'Desc':'Fan with two tableau shuffles',
    'File':'Trefoil',
    'Wikipedia':'https://en.wikipedia.org/wiki/La_Belle_Lucie'
},
{
    'Name':'Trefoil Relaxed',
    'Type':'All,Fan,Tableau Redeal,Easy',
    'Desc':'Fan with two tableau shuffles, sequences of cards can be moved together',
    'File':'TrefoilRelaxed',
    'Wikipedia':'https://en.wikipedia.org/wiki/La_Belle_Lucie'
},
{
    'Name':'Bisley',
    'Type':'All,Bisley',
    'Desc':'a one-deck game where you choose on which foundation a card can be placed',
    'File':'Bisley',
    'Wikipedia':'https://en.wikipedia.org/wiki/Bisley_(solitaire)'
},
{
    'Name':'Aces and Kings',
    'Type':'All,Bisley,Two Packs',
    'Desc':'build up on one foundation, down on the other, but don\'t build on the tableau',
    'File':'AcesAndKings',
    'Wikipedia':'https://en.wikipedia.org/wiki/Aces_and_Kings'
},
{
    'Name':'Acey and Kingsley',
    'Type':'All,Bisley,Two Packs',
    'Desc':'an easier version of Aces and Kings',
    'File':'AceyAndKingsley',
    'Wikipedia':'https://en.wikipedia.org/wiki/Aces_and_Kings'
},
{
    'Name':'Martha',
    'Type':'All,Easy,Bisley',
    'Desc':'easy game with no stock and half the cards start face down',
    'File':'Martha',
    'Wikipedia':'https://en.wikipedia.org/wiki/Martha_(solitaire)'
},
{
    'Name':'Stewart',
    'Type':'All,Bisley',
    'Desc':'a harder version of Martha',
    'File':'Stewart',
    'Wikipedia':'https://en.wikipedia.org/wiki/Martha_(solitaire)'
},
{
    'Name':'Baker\'s Dozen',
    'Type':'All,Bisley,Simple',
    'Desc':'so called because of the 13 columns, the number in a baker\'s dozen',
    'File':'Baker\'sDozen',
    'Wikipedia':'https://en.wikipedia.org/wiki/Baker%27s_Dozen_(solitaire)'
},
{
    'Name':'Spanish',
    'Type':'All,Easy,Simple',
    'Desc':'any card can fill empty tableau spaces',
    'File':'Spanish',
    'Wikipedia':'https://en.wikipedia.org/wiki/Baker%27s_Dozen_(solitaire)'
},
{
    'Name':'Portuguese',
    'Type':'All,Simple',
    'Desc':'halfway between Baker\'s Dozen and Spanish Patience',
    'File':'Portuguese',
    'Wikipedia':'https://en.wikipedia.org/wiki/Baker%27s_Dozen_(solitaire)'
},
{
    'Name':'Castles in Spain',
    'Type':'All,Bisley,Simple',
    'Desc':'like Spanish Patience, but the cards are built down by alternate color',
    'File':'CastlesInSpain',
    'Wikipedia':'https://en.wikipedia.org/wiki/Baker%27s_Dozen_(solitaire)'
},
{
    'Name':'Frog',
    'Type':'All,Frog,Two Packs',
    'Desc':'aka Toad',
    'File':'Frog',
    'Wikipedia':'https://en.wikipedia.org/wiki/Frog_(game)'
},
{
    'Name':'Fly',
    'Type':'All,Frog,Two Packs',
    'Desc':'an easier version of Frog',
    'File':'Fly',
    'Wikipedia':'https://en.wikipedia.org/wiki/Frog_(game)'
},
{
    'Name':'Gnat',
    'Type':'All,Frog',
    'Desc':'a one deck version of Fly',
    'File':'Gnat',
    'Wikipedia':'https://en.wikipedia.org/wiki/Frog_(game)'
},
{
    'Name':'HouseFly',
    'Type':'All,Frog',
    'Desc':'an easier version of Gnat',
    'File':'HouseFly',
    'Wikipedia':'https://en.wikipedia.org/wiki/Frog_(game)'
},
{
    'Name':'Grandfather\'s Clock',
    'Type':'All,Clock,Easy',
    'Desc':'arrange cards in the foundations like a clock',
    'File':'GClock',
    'Wikipedia':'https://en.wikipedia.org/wiki/Grandfather%27s_Clock'
},
{
    'Name':'Osmosis',
    'Type':'All,Other',
    'Desc':'also known as Treasure Trove',
    'File':'Osmosis',
    'Wikipedia':'https://en.wikipedia.org/wiki/Osmosis_(solitaire)'
},
{
    'Name':'Peek',
    'Type':'All,Other',
    'Desc':'Osmosis with a visible reserve',
    'File':'Peek',
    'Wikipedia':'https://en.wikipedia.org/wiki/Osmosis_(solitaire)'
},
{
    'Name':'Busy Aces',
    'Type':'All,Simple,Two Packs',
    'Desc':'simple game dating from 1939',
    'File':'BusyAces',
    'Wikipedia':''
},
{
    'Name':'Courtyard',
    'Type':'All,Simple,Two Packs',
    'Desc':'like Busy Aces, but empty tableau spaces are automatically filled',
    'File':'Courtyard',
    'Wikipedia':''
},
{
    'Name':'Fortune\'s Favor',
    'Type':'All,Easy,Simple',
    'Desc':'like Busy Aces, but empty tableau spaces are automatically filled',
    'File':'FortunesFavor',
    'Wikipedia':'https://en.wikipedia.org/wiki/Fortune%27s_Favor'
},
{
    'Name':'Stages',
    'Type':'All,Simple,Two Packs',
    'Desc':'like Busy Aces, but sequences of tableau cards can be moved',
    'File':'Stages',
    'Wikipedia':''
},
{
    'Name':'Oddstream',
    'Type':'All,Originals,Small Screen',
    'Desc':'tidy the tableau as you go, or you won\'t win',
    'File':'Oddstream',
    'Wikipedia':''
},
{
    'Name':'Oddstream K',
    'Type':'All,Originals,Small Screen',
    'Desc':'harder version of Oddstream',
    'File':'OddstreamK',
    'Wikipedia':''
},
{
    'Name':'Oddstream S',
    'Type':'All,Originals,Small Screen',
    'Desc':'like Oddstream K, but build tableau down in suit',
    'File':'OddstreamS',
    'Wikipedia':''
},
{
  'Name':'Flipflop One Suit',
  'Type':'All,Other,Small Screen,One Suit',
  'Desc':'easiest version of Flipflop by Zach Gage',
  'File':'Flipflop1',
  'Wikipedia':''
},
{
  'Name':'Flipflop Two Suits',
  'Type':'All,Other,Small Screen,Two Suits',
  'Desc':'',
  'File':'Flipflop2',
  'Wikipedia':''
},
{
  'Name':'Flipflop Four Suits',
  'Type':'All,Other,Small Screen',
  'Desc':'',
  'File':'Flipflop4',
  'Wikipedia':''
},
{
    'Name':'Quick Fail',
    'Type':'Debug',
    'Desc':'',
    'File':'QuickFail',
    'Wikipedia':''
},
{
    'Name':'Quick Win',
    'Type':'Debug',
    'Desc':'',
    'File':'QuickWin',
    'Wikipedia':''
}
];

// polyfills for Array.prototypefor.Each and Array.prototype.includes

/**
 * @param {string} str 
 */
function search(str) {

  str = str.toLowerCase();
  const hits = new Set();

  if ( str.length ) {
    Variants.forEach( v => {
      if ( -1 != v.Name.toLowerCase().indexOf(str) ) {
        hits.add(v);
      }
    });

    if ( 0 === hits.size ) {
      Variants.forEach( v => {
        if ( -1 != v.Desc.toLowerCase().indexOf(str) ) {
          hits.add(v);
        }
      });
    }

    if ( 0 === hits.size ) {
      Variants.forEach( v => {
        if ( -1 != v.Type.toLowerCase().indexOf(str) ) {
          hits.add(v);
        }
      });
    }
  }

  const res = document.getElementById('searchResults');
  while ( res.firstChild ) {
    res.removeChild(res.firstChild);
  }

  if ( hits.size ) {
    const ul = peach(res, 'ul');
    hits.forEach( v => {
      peach(ul, 'li', null, null, 
        peach(res, 'a', {href:v.File + '.html'}, v.Name)
      )
    });
  }
}

/**
 * @param {InputEvent} e
 */
function searchEvent(e) {
  search(e.target.value);
}

/**
 * 
 * @param {Element} p 
 * @param {String} eleName 
 * @param {Object=} attribs 
 * @param {String=} text
 * @param {...Element[]=} ch 
 * @returns {Element}
 * or use https://github.com/KoryNunn/crel
 */
function peach(p, eleName, attribs, text, ...ch) {
  const ele = document.createElement(eleName);
  if ( attribs ) for ( let a in attribs ) {
    ele.setAttribute(a, attribs[a]);
  }
  if ( text ) ele.innerHTML = text;
  if ( ch ) ch.forEach( c => ele.appendChild(c) );
  if ( p ) p.appendChild(ele);
  return ele;
}

const types = [];
Variants.forEach( function(v) {
  v.Type.split(',').forEach( function(t) {
    if ( !types.includes(t) )
      types.push(t);
  });
});
types.sort();

const ulOuter = peach(document.getElementById('content'), 'ul', {class:'collapsible'});

for ( let i=0; i<types.length; i++ ) {
  const liOuter = peach(ulOuter, 'li', null, null, 
    peach(null, 'div', {class:'collapsible-header', id:`ch${i}`}, null,
      peach(null, 'h6', null, types[i])
    ));

  const cb = peach(liOuter, 'div', {class:'collapsible-body', id:`cb${i}`});
  const ulInner = peach(cb, 'ul');

  const ty = Variants.filter( function(v) {
    return v.Type.split(',').includes(types[i]);
  });
  ty.sort(function(a, b) { return a.Name.localeCompare(b.Name); });
  ty.forEach( function(t) {
    const listItem = peach(ulInner, 'li');
      const a = peach(listItem, 'a', {href:t.File + '.html'}, null,
        peach(null, 'strong', null, t.Name)
      );
      if ( window.innerWidth > 640 ) {
        peach(listItem, 'span', {class:'right'}, t.Desc);
      }
  });
}

// could use M.AutoInit(document.body)
// (which uses document.body if no context is given)
// instead just init the bits we are using
M.Collapsible.init(document.querySelectorAll('.collapsible'));
M.Modal.init(document.querySelectorAll('.modal'));
M.Tooltip.init(document.querySelectorAll('.tooltipped'));

document.getElementById('searchText').oninput = searchEvent;
document.getElementById('modalLoadSavedDiv').style.display = window.location.protocol === 'file:' ? '' : 'none';

const LOCALSTORAGE_SETTINGS = 'Oddstream Solitaire Settings';
const LOCALSTORAGE_GAMES = 'Oddstream Solitaire Games';
const DROPBOX_GAMES = '/gameState.json';

const settings = JSON.parse(localStorage.getItem(LOCALSTORAGE_SETTINGS)) || {};

const collapsibleFn = M.Collapsible.getInstance(ulOuter);
collapsibleFn.options.onOpenEnd = function() {
  const h6 = document.querySelector('body>div#content>ul.collapsible>li.active>div>h6');
  if ( h6 ) {
    settings.activeType = h6.innerHTML;
  } else {
    delete settings.activeType;
  }
}

const modalSearchFn = M.Modal.getInstance(document.getElementById('modalSearch'));
modalSearchFn.options.onOpenStart = function() {
  const ele = /** @type {HTMLInputElement} */(document.getElementById("searchText"));
  ele.value = '';
  ele.focus();
}

const modalCloudFn = M.Modal.getInstance(document.getElementById('modalCloud'));
modalCloudFn.options.onOpenStart = function() {
  const HIDE_CLASS = 'hide';
  if ( settings.dropboxAccessToken && settings.dropboxAccessToken.length ) {
    document.getElementById('dropboxAccessToken').value = settings.dropboxAccessToken;
    document.getElementById('modalCloudAuto').checked = !!settings.autoCloudSync; // might be undefined
    document.getElementById('modalLoadSaved').checked = !!settings.loadSaved;     // might be undefined
    document.getElementById('modalCloudConnected').classList.remove(HIDE_CLASS);
    document.getElementById('modalCloudNotConnected').classList.add(HIDE_CLASS);
  } else {
    document.getElementById('modalCloudConnected').classList.add(HIDE_CLASS);
    document.getElementById('modalCloudNotConnected').classList.remove(HIDE_CLASS);
    const btn = document.getElementById('btnAuthenticate');
    try {
      const dbx = new Dropbox.Dropbox({fetch: window.fetch.bind(window), clientId: 'gpmr1d1u1j4h2d4'});
      // window.location.origin = 'http://localhost'
      // window.location.pathname = '/solitaire/index.html'
      const redirect = window.location.origin + window.location.pathname;
      // console.log(redirect);
      btn.href = dbx.getAuthenticationUrl(redirect);
    } catch(err) {
      M.toast({html:'cannot connect to Dropbox'});
      console.error(err);
    }
  }
};

modalCloudFn.options.onCloseEnd = function() {
  getAccessTokenFromModal();
  settings.autoCloudSync = document.getElementById('modalCloudAuto').checked;
  settings.loadSaved = document.getElementById('modalLoadSaved').checked;
};

window.onload = function () {
  if ( settings.lastGame ) {
    document.getElementById('lastgame').setAttributeNS(null, 'href', settings.lastGame);
  } else {
    document.getElementById('lastgame').hidden = true;
  }
  if ( settings.activeType ) {
    const nodes = document.querySelectorAll('div.collapsible-header>h6');
    for ( let i=0; i<nodes.length; i++ ) {
      if ( nodes[i].innerHTML === settings.activeType ) {
        collapsibleFn.open(i);
        document.getElementById(`cb${i}`).scrollIntoView();
        break;
      }
    }
  }
  if ( settings.autoCloudSync && settings.dropboxAccessToken ) {
    doSyncDropbox();
  }
}

window.onbeforeunload = function(e) {
  saveSettings(); // may have been changed by modalCloud or active collapsible
}

let params = null;
if ( window.location.hash ) {
  // a DOMString containing a '#' followed by the fragment identifier of the URL
  // #access_token=OvVYXrtX708AAAAAAAAEy7SaxISnKu7zhwZOMWHLFEMjg-GgODz4Ez2vA9HJlLs8&token_type=bearer&uid=154172014&account_id=dbid%3AAADL4ma-7BXSPnEmldVqS9OSe2xHqlV7e1o
  params = new URLSearchParams(window.location.hash.slice(1));
} else if ( window.location.search ) {
  // a DOMString containing a '?' followed by the parameters or 'querystring' of the URL
  params = new URLSearchParams(window.location.search.slice(1));
}

if ( params && params.has('access_token') ) {
  settings.dropboxAccessToken = params.get('access_token');
  modalCloudFn.open();
}

function getAccessTokenFromModal() {
  const txt = settings.dropboxAccessToken = document.getElementById('dropboxAccessToken').value;
  if ( txt.length ) {
    settings.dropboxAccessToken = txt;
  } else {
    delete settings.dropboxAccessToken;
  }
  return settings.dropboxAccessToken && settings.dropboxAccessToken.length > 0;
}

function saveSettings() {
  try {
    localStorage.setItem(LOCALSTORAGE_SETTINGS, JSON.stringify(settings));
    // M.toast({html:'settings saved'});
  } catch(err) {
    M.toast({html:'error saving settings'});
    console.error(err);
  }
}

function saveGameStateToLocalStorage(newGameState) {
  try {
    localStorage.setItem(LOCALSTORAGE_GAMES, JSON.stringify(newGameState));
    M.toast({html:'local games saved'});
  } catch(err) {
    M.toast({html:'error saving games'});
    console.error(err);
  }
}

function loadGameStateFromDropbox(fn) {
  if ( modalCloudFn.isOpen ) {
    if ( !getAccessTokenFromModal() ) {
      M.toast({html:'no access token'});
    }
  }

  let newGameState = {};

  // you can load our UMD package directly from unpkg. This will expose Dropbox as a global - window.Dropbox.Dropbox within browsers.
  let dbx = new Dropbox.Dropbox({ fetch: fetch, accessToken: settings.dropboxAccessToken });
  dbx.filesDownload({path: DROPBOX_GAMES})
  .then(function(response) {
  /*
    response looks like:
        client_modified: '2018-12-16T14:16:01Z'
        content_hash: 'b4b241dc5df25837a6294782f5ac7c6013e9ab17ece41b2d4e9e2696e5beaa9a'
        fileBlob: Blob(52969) {size: 52969, type: 'application/octet-stream'}
        id: 'id:dS3043s2iUgAAAAAAAAJaQ'
        name: 'gameState.json'
        path_display: '/gameState.json'
        path_lower: '/gamestate.json'
        rev: '0170000000107fb1eb0'
        server_modified: '2018-12-16T14:16:02Z'
        size: 52969
    ECMAScript defines a string interchange format for date-times based upon a simplification of the ISO 8601 Extended Format.
    The format is as follows: YYYY-MM-DDTHH:mm:ss.sssZ

    Date.parse('2018-12-16T14:16:01Z') > Date.now()
  */
    let blob = response.fileBlob;
    let reader = new FileReader();
    reader.addEventListener('loadend', function() {
      try {
        newGameState = JSON.parse(reader.result);
        // M.toast({html:'games loaded'});
        fn(newGameState);
      } catch (err) {
        console.error(err);
        M.toast({html:'error in format of cloud games'});
      }
    });
    reader.readAsText(blob);
  })
  .catch(function(error) {
    M.toast({html:'error loading cloud games'});
    console.error(error);
  });
}

function saveGameStateToDropbox(newGameState) {
  if ( modalCloudFn.isOpen ) {
    if ( !getAccessTokenFromModal() ) {
      M.toast({html:'no access token'});
      return;
    }
  }
  // you can load our UMD package directly from unpkg. This will expose Dropbox as a global - window.Dropbox.Dropbox within browsers.
  let dbx = new Dropbox.Dropbox({ fetch: fetch, accessToken: settings.dropboxAccessToken });
  dbx.filesUpload({path: DROPBOX_GAMES, contents: JSON.stringify(newGameState), mode: 'overwrite'})
  .then(function(response) {
    // console.log(response);
    M.toast({html:'games saved to cloud'});
  })
  .catch(function(error) {
    console.error(error);
    M.toast({html:'error saving games to cloud'});
  });
}

function syncDropbox0(cloudGameState) {
  const localGameState = JSON.parse(localStorage.getItem(LOCALSTORAGE_GAMES)) || {};
  const newGameState = {};
  let saveCloud = false;
  let saveLocal = false;
  const sortedVariants = Variants.sort(function(a, b) { return a.Name.localeCompare(b.Name); });
  sortedVariants.forEach( function(v) {
    const cloud = cloudGameState[v.Name];
    const local = localGameState[v.Name];
    if ( local && cloud ) {
      if ( local.modified && cloud.modified ) {
        // modified = Date.now(), introduced 25/12/18
        if ( local.modified > cloud.modified ) {
          console.log(v.Name, 'local newer than cloud');
          newGameState[v.Name] = local;
          saveCloud = true;
        } else if ( cloud.modified > local.modified ) {
          console.log(v.Name, 'cloud newer than local');
          newGameState[v.Name] = cloud;
          saveLocal = true;
        } else {
          newGameState[v.Name] = local; // whatever
        }
      } else {
        if ( local.totalGames > cloud.totalGames ) {
          console.log(v.Name, 'local > cloud');
          newGameState[v.Name] = local;
          saveCloud = true;
        } else if ( cloud.totalGames > local.totalGames ) {
          console.log(v.Name, 'cloud > local');
          newGameState[v.Name] = cloud;
          saveLocal = true;
        } else {
          newGameState[v.Name] = local; // whatever
        }
      }
    } else if ( local ) {
      console.log(v.Name, 'local but not cloud');
      newGameState[v.Name] = local;
      saveCloud = true;
    } else if ( cloud ) {
      console.log(v.Name, 'cloud but not local');
      newGameState[v.Name] = cloud;
      saveLocal = true;
    } else {
      console.log(v.Name, 'neither');
    }
  });
  if ( saveLocal ) {
    saveGameStateToLocalStorage(newGameState);
  }
  if ( saveCloud ) {
    saveGameStateToDropbox(newGameState);
  }
  if ( saveLocal || saveCloud ) {
    // M.toast({html:'game sync completed'});
  } else {
    M.toast({html:'no changes to save'});
  }
}

function doSyncDropbox() {
  loadGameStateFromDropbox(syncDropbox0);
}
