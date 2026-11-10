---
title: "ros2"
pubDatetime: 2026-11-10T00:00:00+08:00
description: "一些跟着鱼香ros学的皮毛"
tags: ["ros2", "etudier"]
draft: false
---

## CMake 注意事项

当在一个功能包中添加了一个新的节点：`<文字 示例>`

- 首先添加可执行文件 `add_executable(cpp_node src/cpp_node.cpp)`
- 如果有新的依赖 `find_package(rclcpp REQUIRED)`
- 给可执行文件绑定依赖 `ament_target_dependencies(cpp_node rclcpp)`
- 把可执行文件下载在正确的目录下

```cmake
install(TARGETS
  cpp_node person_node learn_auto
  DESTINATION lib/${PROJECT_NAME}
)
```

## cpp 新特性

**auto** 自动推导变量类型

**共享指针** 专治站着茅坑不拉屎的。注意 **make_shared** 本身返回的是一个 **shared_ptr** 的对象，使用 . 来访问对象自身的成员，使用 -> 来访问指针指向的数据

**Lambda** 也就是换个语法写的函数（暂时可以这么理解吧）

**函数包装器** 就是把不用类型的函数，统一一下调用方式

```c++
#include <iostream>
#include <functional>

//自由全局函数
void free_use(const std::string & s) {
  std::cout << "自由全局函数 " << s << std::endl;
}

//成员函数
class Use {
public:
  Use() {}
  ~Use() {}

  void member_use(const std::string & s) {
    std::cout << "成员函数 " << s << std::endl;
  }
};

int main() {
  Use myuse;
  //lambda 表达式
  auto lambda_use = [](const std::string & s) -> void { std::cout << "lambda表达式 " << s << std::endl; };
  
  //使用函数包装器来统一不同形式的函数的调用方式
  std::function<void(const std::string &)> use1 = free_use;
  std::function<void(const std::string &)> use2 = lambda_use;
  //成员函数的比较麻烦，但是后面会比较常用哦
  std::function<void(const std::string &)> use3 = std::bind(&Use::member_use, &myuse, std::placeholders::_1);

  use1("我是帅哥");
  use2("我是帅哥");
  use3("我是帅哥");

  return 0;
}

```

