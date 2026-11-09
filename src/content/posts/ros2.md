## CMake注意事项
当在一个功能包中添加了一个新的节点：<文字 示例>
* 首先添加可执行文件 `add_executable(cpp_node src/cpp_node.cpp)`
* 如果有新的依赖 `find_package(rclcpp REQUIRED)`
* 给可执行文件绑定依赖 `ament_target_dependencies(cpp_node rclcpp)`
* 把可执行文件下载在正确的目录下 
```cmake
install(TARGETS 
  cpp_node person_node learn_auto
  DESTINATION lib/${PROJECT_NAME}
)
```

## cpp新特性

**auto** 自动推导变量类型

**共享指针**