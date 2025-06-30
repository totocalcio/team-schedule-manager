import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    console.log('=== Supabase接続テスト開始 ===')
    
    // 環境変数の確認
    const config = useRuntimeConfig()
    const supabaseUrl = config.public.supabaseUrl
    const supabaseAnonKey = config.public.supabaseAnonKey
    
    console.log('SUPABASE_URL:', supabaseUrl ? '設定済み' : '未設定')
    console.log('SUPABASE_ANON_KEY:', supabaseAnonKey ? '設定済み' : '未設定')
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        success: false,
        error: 'Supabase環境変数が設定されていません',
        details: {
          supabaseUrl: !!supabaseUrl,
          supabaseAnonKey: !!supabaseAnonKey
        }
      }
    }
    
    // Supabaseクライアントの作成テスト
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    console.log('Supabaseクライアント作成: 成功')
    
    // データベース接続テスト
    const { data: testData, error: testError } = await supabase
      .from('calendars')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('データベース接続エラー:', testError)
      return {
        success: false,
        error: 'データベース接続に失敗しました',
        details: {
          message: testError.message,
          code: testError.code,
          hint: testError.hint
        }
      }
    }
    
    console.log('データベース接続: 成功')
    
    // テーブル構造の確認
    const { data: tableInfo, error: tableError } = await supabase
      .from('calendars')
      .select('*')
      .limit(0)
    
    if (tableError) {
      console.error('テーブル構造確認エラー:', tableError)
      return {
        success: false,
        error: 'calendarsテーブルにアクセスできません',
        details: {
          message: tableError.message,
          code: tableError.code,
          hint: tableError.hint
        }
      }
    }
    
    console.log('calendarsテーブル: アクセス可能')
    
    // RLSポリシーのテスト（実際にINSERTを試行）
    const testCalendar = {
      name: 'テスト用カレンダー_' + Date.now(),
      description: 'Supabase接続テスト用'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('calendars')
      .insert([testCalendar])
      .select()
      .single()
    
    if (insertError) {
      console.error('INSERT テストエラー:', insertError)
      return {
        success: false,
        error: 'カレンダーの作成に失敗しました（RLSポリシーまたは権限の問題の可能性）',
        details: {
          message: insertError.message,
          code: insertError.code,
          hint: insertError.hint
        }
      }
    }
    
    console.log('INSERT テスト: 成功', insertData)
    
    // テストデータを削除
    const { error: deleteError } = await supabase
      .from('calendars')
      .delete()
      .eq('id', insertData.id)
    
    if (deleteError) {
      console.warn('テストデータの削除に失敗:', deleteError)
    } else {
      console.log('テストデータ削除: 成功')
    }
    
    console.log('=== Supabase接続テスト完了 ===')
    
    return {
      success: true,
      message: 'Supabase接続テストが正常に完了しました',
      details: {
        supabaseUrl: supabaseUrl,
        databaseConnection: true,
        tableAccess: true,
        insertPermission: true,
        testCalendarId: insertData.id
      }
    }
    
  } catch (error: any) {
    console.error('=== Supabase接続テストでエラーが発生 ===')
    console.error('エラー詳細:', error)
    
    return {
      success: false,
      error: '予期しないエラーが発生しました',
      details: {
        message: error.message,
        stack: error.stack
      }
    }
  }
})