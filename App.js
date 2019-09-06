import React, { Component } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Image,
  Animated,
  TouchableWithoutFeedback,
  TouchableOpacity,
  CameraRoll,
  Share
} from "react-native";
import * as Permissions from "expo-permissions";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";

import axios from "axios";

const { height, width } = Dimensions.get("window");
export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      images: [],
      scale: new Animated.Value(1),
      isImageFocused: false
    };

    this.scale = {
      transform: [{ scale: this.state.scale }]
    };

    this.actionBarY = this.state.scale.interpolate({
      inputRange: [0.9, 1],
      outputRange: [0, -80]
    });
    this.borderRadius = this.state.scale.interpolate({
      inputRange: [0.9, 1],
      outputRange: [30, 0]
    });
  }

  componentDidMount = () => {
    this.loadWallpapers();
  };

  loadWallpapers() {
    axios
      .get(
        "https://api.unsplash.com/photos/random?count=30&client_id=ea68cd6583dad009a4f85797ca4e6bd849d85cc75d2fd44f771ff81794ff3b02"
      )
      .then(res => {
        console.log(res.data);
        this.setState({
          images: res.data,
          isLoading: false
        });
      })
      .catch(err => console.error(err))
      .finally(() => {
        console.log("request completed");
      });
  }

  showControls = item => {
    this.setState(
      prevState => ({
        isImageFocused: !prevState.isImageFocused
      }),
      () => {
        if (this.state.isImageFocused) {
          Animated.spring(this.state.scale, {
            toValue: 0.9
          }).start();
        } else {
          Animated.spring(this.state.scale, {
            toValue: 1
          }).start();
        }
      }
    );
  };

  saveToCameraRoll = async image => {
    let cameraPermissions = await Permissions.getAsync(Permissions.CAMERA_ROLL);
    if (cameraPermissions.status !== "granted") {
      cameraPermissions = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    }
    if (cameraPermissions.status === "granted") {
      FileSystem.downloadAsync(
        image.urls.regular,
        FileSystem.documentDirectory + image.id + ".jpg"
      )
        .then(({ uri }) => {
          CameraRoll.saveToCameraRoll(uri);
          alert("Saved to photos");
        })
        .catch(err => console.error(error));
    } else {
      alert("Requires camera and storage permission");
    }
  };

  shareWallpaper = async image => {
    try {
      await Share.share({
        message: "Checkout this wallpaper " + image.urls.full
      });
    } catch (error) {
      console.error(error);
    }
  };

  renderItem = ({ item }) => (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "black",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <ActivityIndicator size="large" color="grey" />
      </View>
      <TouchableWithoutFeedback onPress={() => this.showControls(item)}>
        <Animated.View style={[{ height, width }, this.scale]}>
          <Animated.Image
            style={{
              flex: 1,
              height: null,
              width: null,
              borderRadius: this.borderRadius
            }}
            source={{ uri: item.urls.regular }}
            resizeMode="cover"
          />
        </Animated.View>
      </TouchableWithoutFeedback>
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: this.actionBarY,
          height: 80,
          backgroundColor: "black",
          flexDirection: "row",
          justifyContent: "space-around"
        }}
      >
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={() => this.loadWallpapers()}
          >
            <Ionicons name="ios-refresh" color="white" size={40} />
          </TouchableOpacity>
        </View>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={() => this.shareWallpaper(item)}
          >
            <Ionicons name="ios-share" color="white" size={40} />
          </TouchableOpacity>
        </View>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={() => this.saveToCameraRoll(item)}
          >
            <Ionicons name="ios-save" color="white" size={40} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );

  render() {
    return this.state.isLoading ? (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="grey" />
      </View>
    ) : (
      <View style={styles.container}>
        <FlatList
          scrollEnabled={!this.state.isImageFocused}
          horizontal
          pagingEnabled
          data={this.state.images}
          renderItem={this.renderItem}
          keyExtractor={item => item.id}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center"
  }
});
