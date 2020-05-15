import $http from '@/config/requestConfig'
import store from '@/config/store';
import { getAppWxLatLon } from '@/plugins/utils';
// #ifdef H5
import { getLatLonH5, publicShareFun } from '@/config/html5Utils';
// 公众号分享
export const publicShare = publicShareFun;
// #endif
// #ifdef APP-PLUS
import appShareFun from '@/plugins/share';
// APP分享
export const appShare = appShareFun;
// #endif

// #ifdef MP-WEIXIN
// 微信小程序分享
export const wxShare = function (title,path) {
	let shareInfo = {
		title: title || base.share.title,
	};
	if(path && typeof(path) == "string"){
		shareInfo.path = path;
	}else if(path === undefined){
		shareInfo.path = base.share.path;
	}
	if (store.state.userInfo.token) {
		if (shareInfo.path.indexOf("?") >= 0) {
			shareInfo.path += "&recommendCode=" + store.state.userInfo.uid;
		} else {
			shareInfo.path += "?recommendCode=" + store.state.userInfo.uid;
		}
	}
	return shareInfo;
}
// #endif

//支付（APP微信支付、APP支付宝支付、微信小程序支付）
export const setPay = function(payInfo, callback) {
	let httpUrl = "";
	if (payInfo.type == 'wxpay') {
		httpUrl = 'api/pay/v1/pay_sign_wx'
	} else if (payInfo.type == 'alipay') {
		httpUrl = 'api/pay/v1/pay_sign_ali'
	} else if (payInfo.type == 'smallPay') {
		httpUrl = 'api/pay/v1/small_pay_sign_wx'
	}
	$http.get(httpUrl, {
		orderNo: payInfo.orderNo
	}).then(data => {
		let payData = {
			success: function(res) {
				callback && callback({
					success: true,
					data: res
				});
				console.log('success:' + JSON.stringify(res));
			},
			fail: function(err) {
				callback && callback({
					success: false,
					data: err
				});
				console.log('fail:' + JSON.stringify(err));
			}
		};
		if (payInfo.type == 'smallPay') {
			// 小程序
			payData.provider = 'wxpay';
			payData.timeStamp = data.timeStamp;
			payData.nonceStr = data.nonceStr;
			payData.package = data.package;
			// payData.package = "prepay_id=" + data.prepayid;
			payData.signType = "MD5";
			payData.paySign = data.sign;
		} else if (payInfo.type == 'wxpay') {
			// app微信
			payData.provider = 'wxpay';
			payData.orderInfo = data;
		} else if (payInfo.type == 'alipay') {
			// app 支付宝
			payData.provider = 'alipay';
			payData.orderInfo = data;
		} else if (payInfo.type == 'baidu') {
			payData.provider = 'baidu';
			payData.orderInfo = data;
		}
		console.log("支付参数", payData);
		uni.requestPayment(payData);
	}, err => {
		callback && callback({
			success: false,
			data: err
		});
	});
}
// 支付统一分配
export const setPayAssign = function(orderInfo, callback) {
	orderInfo.price = orderInfo.price || orderInfo.pricePay;
	orderInfo.title = orderInfo.title || orderInfo.orderTitle;
	//支付
	// #ifdef APP-PLUS
	uni.navigateTo({
		url: '/pages/home/weChatPay?orderNo=' + orderInfo.orderNo + '&price=' + orderInfo.price + '&title=' + orderInfo.title
	});
	// #endif 
	// #ifdef MP-WEIXIN
	setPay({
		...orderInfo,
		type: "smallPay"
	}, callback);
	// #endif
	// #ifdef H5
	if (getBrowser() === '微信') {
		uni.navigateTo({
			url: '/pages/home/weChatPay?orderNo=' + orderInfo.orderNo + '&price=' + orderInfo.price + '&title=' + orderInfo.title
		});
	} else {
		appMutual('setJumpPay', orderInfo);
	}
	// #endif
}
// 获取地址信息 （微信小程序、APP、公众号）
export const getLatLon = function(tip){
	return new Promise((resolve, reject) => {
		const successProcess = function(res){
			store.commit("setCurrentAddress", {
				latitude: res.latitude,
				longitude: res.longitude
			});
			resolve(res);
		};
		const errProcess = function(err){
			reject(err);
			if(tip){
				uni.showToast({
					title: err,
					icon: "none"
				});
			}
		};
		// #ifdef H5
		getLatLonH5(successProcess,errProcess);
		// #endif
		// #ifndef H5
		getAppWxLatLon(successProcess,errProcess);
		// #endif
	});
}




