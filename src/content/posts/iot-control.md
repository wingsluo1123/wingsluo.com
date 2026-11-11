---
title: "物联网控制"
pubDatetime: 2026-11-09T00:00:00+08:00
description: "物联网控制etudier"
tags: ["etudier"]
draft: false
typora-root-url: ../../../public
typora-copy-images-to: ../../../public/images/iot-control
---

## **第一章**

控制是二者间的作用：控制器+被控对象

第一个自动控制系统：飞球调节器

自动控制理论的开端：麦克斯韦的“论调速器”：建立系统微分方程，分析解的稳定性，变成了判别微分方程的特征根的实部的正、负号问题

![物联网控制笔记配图 1](/images/iot-control/image.png)

可以把控制器比做公司的高管，高管接到客户的需求，告诉自己的下属（执行机构），下属去执行任务，得到产品（被控对象），客户/用户体验反馈给售后部门（传感器），售后部门再通知高管，高管再让下属进行相关的优化。

![物联网控制笔记配图 2](/images/iot-control/image-1.png)

比如人闭眼走路是开环，配上一根拐杖就是闭环。相当于拐杖是盲人的眼睛。

![物联网控制笔记配图 3](/images/iot-control/image-2.png)

就相当于信号传输输入输出多了个a和d的相互转换的过程，再加一个时钟信号的同步。
数字计算机及A/D、D/A转换器等统称为计算机系统

物联网控制系统是以物联网为基础的计算机控制系统

![物联网控制笔记配图 4](/images/iot-control/image-3.png)

自动控制系统性能的基本要求：稳，准，快

稳：首要条件，系统全部特征根(极点)的实部小于零，定义是系统受到干扰后仍能回到平衡点

![物联网控制笔记配图 5](/images/iot-control/image-4.png)

准

![物联网控制笔记配图 6](/images/iot-control/image-5.png)

快

![物联网控制笔记配图 7](/images/iot-control/image-6.png)

![物联网控制笔记配图 8](/images/iot-control/image-7.png)

一些待解决的问题：
默写方框图
各个类型的自动控制系统之间的联系与区别
系统的基本要求对应的性能指标是什么

## **第四章**

微分方程模型：描述系统输出变量和输入变量之间动态关系的微分方程

线性系统（不含常数项的微分方程，各阶导数都是一次幂）满足叠加原理：

![物联网控制笔记配图 9](/images/iot-control/image-8.png)

基础拉屎变化

![物联网控制笔记配图 10](/images/iot-control/image-9.png)

![物联网控制笔记配图 11](/images/iot-control/image-10.png)

![物联网控制笔记配图 12](/images/iot-control/image-11.png)

![物联网控制笔记配图 13](/images/iot-control/image-12.png)

![物联网控制笔记配图 14](/images/iot-control/image-13.png)

![物联网控制笔记配图 15](/images/iot-control/image-14.png)

典型的拉屎变换（ 注意，其实f(t)的后面其实都带有一个u(t)只是因为t>=0所以直接把u(t)看作是1 ）

![物联网控制笔记配图 16](/images/iot-control/image-15.png)

![物联网控制笔记配图 17](/images/iot-control/image-16.png)

拉屎变换的性质

![物联网控制笔记配图 18](/images/iot-control/image-17.png)

![物联网控制笔记配图 19](/images/iot-control/image-18.png)

这是一些例题和解答过程：

![物联网控制笔记配图 20](/images/iot-control/image-20261101123551964.png)

![物联网控制笔记配图 21](/images/iot-control/fbe412698d3f58374e8b57758656b9db.jpg)

![物联网控制笔记配图 22](/images/iot-control/image-20261101161138668.png)

![物联网控制笔记配图 23](/images/iot-control/594730c8678abf31394e27f49af0e98e.jpg)

![物联网控制笔记配图 24](/images/iot-control/image-20261101172121912.png)

待解决的问题：
完成所有的例题 bingo
学习如何求出稳态误差
学习终值定理

## 第五章

PID比例积分微分，

比例的控制规律：

![物联网控制笔记配图 25](/images/iot-control/image-20261101125958370.png)

比例积分的控制规律

![物联网控制笔记配图 26](/images/iot-control/image-20261101130009626.png)

比例微分的控制规律

![物联网控制笔记配图 27](/images/iot-control/image-20261101130230189.png)

比例积分微分控制规律

![物联网控制笔记配图 28](/images/iot-control/image-20261101130319721.png)

要点：记住每个控制方程的时域（微分方程）和复域（传递函数），记住每个控制对系统性能的影响

如何调节控制参数：根据试凑法，先调节 Kp 以得到反应快超调小的曲线；如果有稳态误差，加入积分环节，减小 Kp 并增大积分常数以消除静态误差；若动态过程仍然不满意，加入微分环节，逐步增大 Kd，同时相应改变 Kp 和 Ki， 直至获得满意的调解效果

**试凑法确定PID参数：**

![物联网控制笔记配图 29](/images/iot-control/image-20261101140807363.png)

![物联网控制笔记配图 30](/images/iot-control/image-20261101140817512.png)

![物联网控制笔记配图 31](/images/iot-control/image-20261101140824981.png)

**增量式PID的推导过程：**
首先要知道位置式：

![物联网控制笔记配图 32](/images/iot-control/image-20261101141711268.png)

然后开始计算u(k) - u(k-1)，得到：

![物联网控制笔记配图 33](/images/iot-control/image-20261101142948509.png)

这就是增量式PID或者叫做速度型PID

**如何判断系统是否稳定？**

![物联网控制笔记配图 34](/images/iot-control/image-20261101203519268.png)

判断方法：
1 （对于1阶和2阶的微分方程）直接看**微分方程**的系数，如果都是正的，那么肯定稳定，有一个负数，绝对不稳定。**注意这里是看微分方程的系数，不是特征函数的系数啊，期中考痛失一道大题**

2 以传递函数分母为特征函数，如果都是负的，那么稳定；如果是复域的，那么只看实部，实部是负的就是稳定的，如果是零，工程上视为不稳定。
