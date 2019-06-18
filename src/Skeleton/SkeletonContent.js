import * as React from "react";
import PropTypes from "prop-types";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  ViewPropTypes
} from "react-native";
import { LinearGradient } from "expo";
import {
  DEFAULT_BONE_COLOR,
  DEFAULT_BORDER_RADIUS,
  DEFAULT_HIGHLIGHT_COLOR,
  DEFAULT_EASING,
  DEFAULT_INTENSITY,
  DEFAULT_DURATION,
  DEFAULT_ANIMATION
} from "./Constants";

const numberValidator = (props, propName, componentName, lower, upper) => {
  if (props[propName] < lower || props[propName] > upper) {
    return new Error(
      `PropType error : Invalid range for ${
        props[propName]
      } in ${componentName}`
    );
  }
};

export default class SkeletonContent extends React.Component {
  constructor(props) {
    super(props);
    this.style = this.props.style;
    this.intensity = this.props.intensity;
    this.duration = this.props.duration;
    this.easing = this.props.easing;
    this.highlightColor = this.props.highlightColor;
    this.boneColor = this.props.boneColor;
    this.animationType = this.props.animationType;

    this.animationPulse = new Animated.Value(0);
    this.animationShiver = new Animated.Value(0);
    this.interpolatedOpacity = this.animationPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1 - this.intensity]
    });

    this.gradientStart = this.getGradientDirection("start");
    this.gradientEnd = this.getGradientDirection("end");

    this.state = {
      isLoaded: this.props.isLoaded,
      layout: this.props.layout
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (
      nextProps.isLoaded !== prevState.isLoaded ||
      nextProps.layout !== prevState.layout
    ) {
      return { isLoaded: nextProps.isLoaded, layout: nextProps.layout };
    }
    return null;
  }

  componentDidMount() {
    this.playAnimation();
  }

  playAnimation = () => {
    if (this.animationType === "pulse") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(this.animationPulse, {
            toValue: 1,
            duration: this.duration / 2,
            easing: this.easing,
            delay: this.duration
          }),
          Animated.timing(this.animationPulse, {
            toValue: 0,
            easing: this.easing,
            duration: this.duration / 2
          })
        ])
      ).start();
    } else {
      Animated.loop(
        Animated.timing(this.animationShiver, {
          toValue: 1,
          duration: this.duration,
          easing: this.easing
        })
      ).start();
    }
  };

  getBoneStyles = (boneLayout, interpolatedOpacity) => {
    let boneStyle = {
      width: boneLayout.width || 0,
      height: boneLayout.height || 0,
      borderRadius: boneLayout.borderRadius || DEFAULT_BORDER_RADIUS,
      backgroundColor: boneLayout.backgroundColor || this.boneColor,
      ...boneLayout
    };
    if (this.animationType === "pulse") {
      boneStyle.opacity = interpolatedOpacity;
    } else if (this.animationType !== "none") {
      boneStyle.overflow = "hidden";
    }
    return boneStyle;
  };

  getGradientDirection = type => {
    let direction = {};
    if (
      this.animationType === "shiverLeft" ||
      this.animationType === "shiverRight"
    ) {
      if (type === "start") direction = { x: 0, y: 0 };
      else direction = { x: 1, y: 0 };
    } else {
      if (type === "start") direction = { x: 0, y: 0 };
      else direction = { x: 0, y: 1 };
    }
    return direction;
  };

  getGradientTransform = (shiverValue, boneLayout) => {
    let transform = {};
    const interpolatedPosition = shiverValue.interpolate({
      inputRange: [0, 1],
      outputRange: this.getPositionRange(boneLayout)
    });
    if (
      this.animationType === "shiverLeft" ||
      this.animationType === "shiverRight"
    ) {
      transform = { translateX: interpolatedPosition };
    } else {
      transform = { translateY: interpolatedPosition };
    }
    return transform;
  };

  getPositionRange = boneLayout => {
    let outputRange = [];
    const boneWidth = boneLayout.width || 0;
    const boneHeight = boneLayout.height || 0;

    if (this.animationType === "shiverRight") {
      outputRange.push(-boneWidth, boneWidth);
    } else if (this.animationType === "shiverLeft") {
      outputRange.push(boneWidth, -boneWidth);
    } else if (this.animationType === "shiverDown") {
      outputRange.push(-boneHeight, boneHeight);
    } else {
      outputRange.push(boneHeight, -boneHeight);
    }
    return outputRange;
  };

  getBones = layout => {
    const iterator = Array.from(new Array(layout.length));
    return iterator.map((_, i) => {
      if (this.animationType === "pulse" || this.animationType === "none") {
        return (
          <Animated.View
            style={this.getBoneStyles(layout[i], this.interpolatedOpacity)}
          />
        );
      } else {
        return (
          <View style={this.getBoneStyles(layout[i], this.interpolatedOpacity)}>
            <Animated.View
              style={[
                styles.absoluteGradient,
                {
                  transform: [
                    this.getGradientTransform(this.animationShiver, layout[i])
                  ]
                }
              ]}
            >
              <LinearGradient
                colors={[this.boneColor, this.highlightColor, this.boneColor]}
                start={this.gradientStart}
                end={this.gradientEnd}
                style={styles.gradientChild}
              />
            </Animated.View>
          </View>
        );
      }
    });
  };

  renderLayout = (isLoaded, bones, children) => (isLoaded ? children : bones);

  render() {
    const { isLoaded, layout } = this.state;
    const { children } = this.props;
    const bones = this.getBones(layout);

    return (
      <View style={this.style}>
        {this.renderLayout(isLoaded, bones, children)}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1
  },
  absoluteGradient: {
    position: "absolute",
    width: "100%",
    height: "100%"
  },
  gradientChild: {
    flex: 1
  }
});

SkeletonContent.propTypes = {
  isLoaded: PropTypes.bool.isRequired,
  layout: PropTypes.arrayOf(PropTypes.object).isRequired,
  duration: (props, propName, componentName) =>
    numberValidator(props, propName, componentName, 0, Infinity),
  style: ViewPropTypes.style,
  easing: PropTypes.oneOfType([typeof Easing]),
  animationType: PropTypes.oneOf([
    "none",
    "shiverLeft",
    "shiverRight",
    "shiverTop",
    "shiverDown",
    "pulse"
  ]),
  boneColor: PropTypes.string,
  intensity: (props, propName, componentName) =>
    numberValidator(props, propName, componentName, 0, 1),
  highlightColor: PropTypes.string
};

SkeletonContent.defaultProps = {
  style: styles.container,
  easing: DEFAULT_EASING,
  duration: DEFAULT_DURATION,
  layout: [],
  animationType: DEFAULT_ANIMATION,
  isLoaded: false,
  boneColor: DEFAULT_BONE_COLOR,
  intensity: DEFAULT_INTENSITY,
  highlightColor: DEFAULT_HIGHLIGHT_COLOR
};
