<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.10" tiledversion="1.11.2" name="Actors" tilewidth="64" tileheight="64" tilecount="3" columns="0" objectalignment="bottom" tilerendersize="grid" fillmode="preserve-aspect-fit">
 <grid orientation="orthogonal" width="1" height="1"/>
 <tile id="0" type="spawn">
  <properties>
   <property name="kind" value="player"/>
   <property name="type" value="spawn"/>
  </properties>
  <image source="source/repos/lta/lennyToastAdventure/src/assets/sprites/lenny/grey.PNG" width="64" height="64"/>
 </tile>
 <tile id="1" type="sockroach">
  <properties>
   <property name="kind" value="sockroach"/>
   <property name="pathName" value=""/>
   <property name="speed" value="50"/>
   <property name="type" value="enemy"/>
  </properties>
  <image source="source/repos/lta/lennyToastAdventure/src/assets/sprites/sockroach/sockroach_walk_5.png" width="64" height="64"/>
 </tile>
 <tile id="3" type="toast">
  <properties>
   <property name="kind" value="toast"/>
   <property name="type" value="collectible"/>
   <property name="value" value="1"/>
  </properties>
  <image source="source/repos/lta/lennyToastAdventure/src/assets/sprites/toast/toast_sprite.png" width="64" height="63"/>
 </tile>
</tileset>
