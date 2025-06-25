# 🛠️ ROS 2 Cheatsheet & Quick Reference

## 🧱 Basic Concepts

- **Nodes**: Fundamental processes that use ROS 2.
- **Topics**: Unidirectional pub-sub communication between nodes.
- **Services**: Synchronous request/response communication.
- **Actions**: Asynchronous goal-based communication (e.g., navigation).
- **Parameters**: Configuration variables in nodes.
- **Launch Files**: XML or Python scripts to start multiple nodes.

---

## 🛠️ Environment Setup

```bash
# Source ROS 2 setup
source /opt/ros/<distro>/setup.bash

# Create a workspace
mkdir -p ~/ros2_ws/src
cd ~/ros2_ws
colcon build
source install/setup.bash

# Create a new package
ros2 pkg create --build-type ament_cmake <package_name>
ros2 pkg create --build-type ament_python <package_name>

# List packages
ros2 pkg list
ros2 pkg prefix <package_name>

cd ~/ros2_ws
colcon build --packages-select <package_name>
source install/setup.bash

# Run a node
ros2 run <package_name> <executable>

# List active nodes
ros2 node list

# Get info about a node
ros2 node info <node_name>

# List topics
ros2 topic list
ros2 topic list -t  # with types

# Echo messages
ros2 topic echo <topic_name>

# Publish a message
ros2 topic pub <topic_name> <msg_type> '{...}'

# Info about a topic
ros2 topic info <topic_name>

# ROS 2 message types
ros2 interface list | grep msg
ros2 interface show <msg_type>

# List services
ros2 service list

# Call a service
ros2 service call <service_name> <srv_type> '{...}'

# Service type info
ros2 service type <service_name>
ros2 interface show <srv_type>

# List actions
ros2 action list

# Send a goal
ros2 action send_goal <action_name> <action_type> '{...}'

# Show feedback/results
ros2 action list -t

# List node parameters
ros2 param list
ros2 param list <node_name>

# Get a parameter
ros2 param get <node_name> <param_name>

# Set a parameter
ros2 param set <node_name> <param_name> <value>

# Run a launch file
ros2 launch <package_name> <file_name>.py

# Example
ros2 launch demo_nodes_cpp talker_listener.launch.py

# Test communication
ros2 topic hz <topic_name>    # Message frequency
ros2 topic bw <topic_name>    # Bandwidth usage

# QoS info
ros2 topic info <topic_name> --qos

# Kill a node
Ctrl+C or pkill -f <node_name>

# List all interfaces
ros2 interface list
ros2 interface show <msg/srv/action>

# RQt tools (if installed)
rqt_graph
rqt_plot
rqt_console
